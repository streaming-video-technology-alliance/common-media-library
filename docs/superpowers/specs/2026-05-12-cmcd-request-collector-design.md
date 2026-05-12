# CmcdRequestCollector — Design Spec

**Date**: 2026-05-12
**Package**: `@svta/cml-cmcd`
**Status**: Approved (pending implementation plan)

## Background

Two open PRs in the wider streaming ecosystem each add a near-identical test helper for asserting on CMCD requests:

- **dash.js [#4816](https://github.com/Dash-Industry-Forum/dash.js/pull/4816)** — `test/functional/helpers/CmcdRequestCollector.js` (XHR-based, 208 lines)
- **hls.js [#7725](https://github.com/video-dev/hls.js/pull/7725)** — `tests/mocks/cmcd-request-collector.ts` (fetch-based, 204 lines)

Both helpers exist because `CmcdReporter` (from `@svta/cml-cmcd`) is the central piece that adopters need to verify in their e2e suites. They diverge mainly on transport (XHR vs fetch), storage shape, and timeout semantics — concerns that a unified helper inside the CMCD package itself can normalize.

Distributing one collector via `@svta/cml-cmcd` means future CMCD adopters get a tested, documented test helper out of the box.

## Goals

1. Capture CMCD-bearing requests emitted by a player under test, regardless of whether the player uses XHR or fetch.
2. Produce stored entries that feed `validateCmcdRequest` from the same package directly, no conversion required.
3. Allow tests to wait deterministically for N requests of a given type (manifest / segment / event).
4. Intercept POST requests to event-target URLs and return a synthetic successful response, so tests don't make outbound network calls to placeholder endpoints.
5. Be extensible to other transport mechanisms (node-fetch, undici, player-internal HTTP clients) via a small adapter contract.

## Non-goals

- Replacing `validateCmcdRequest` — the collector captures; consumers validate.
- Decoding or interpreting CMCD payloads. That belongs to `decodeCmcd` / `validateCmcd`.
- Mocking responses for non-event requests. Manifest/segment requests pass through to the real transport.
- Cross-realm (worker, iframe) transport patching. The collector patches the realm it's installed in.

## Architecture

### File layout

All files live in `libs/cmcd/src/`, following existing naming conventions:

- `CmcdRequestCollector.ts` — the class
- `CmcdCollectedRequest.ts` — captured-request type
- `CmcdRequestType.ts` — `'manifest' | 'segment' | 'event' | 'unknown'` (const-enum pattern: individual `as const` + collector object + `ValueOf<typeof ...>` type)
- `CmcdTransportAdapter.ts` — adapter contract type
- `createXhrTransport.ts` — default XHR adapter (factory function)
- `createFetchTransport.ts` — default fetch adapter (factory function)

Each file has a single responsibility, mirroring the rest of the package (`CmcdReporter.ts`, `CmcdReporterConfig.ts`, etc.).

### Distribution

All exports go in the main barrel (`libs/cmcd/src/index.ts`), alongside `CmcdReporter`. No subpath export, no separate package. Test patching code runs only when `attach()` is called, so unused adopters don't execute it — and bundlers tree-shake the class away if never imported.

### Test framework

Tests use `node:test` + `node:assert` consistent with the rest of the package. They install minimal `globalThis.XMLHttpRequest` / `globalThis.fetch` shims rather than depending on a browser — adopters do their browser-level validation in their own e2e suites.

## Public API

```ts
export class CmcdRequestCollector {
    attach(options?: CmcdRequestCollectorOptions): void;
    detach(): void;
    clear(): void;
    getRequests(type?: CmcdRequestType): CmcdCollectedRequest[];

    /**
     * Wait until at least `count` requests of the given type are captured,
     * then resolve with all matching captures. Rejects on timeout.
     *
     * Use for positive assertions ("the player should emit at least N
     * requests").
     */
    waitForRequests(
        type: CmcdRequestType | undefined,
        count: number,
        timeout?: number,
    ): Promise<CmcdCollectedRequest[]>;

    /**
     * Wait for the given duration, then resolve with all matching captures
     * collected so far. Never rejects (other than via `detach()`).
     *
     * Use for negative or upper-bound assertions ("no event requests should
     * fire", "exactly N segments and no more").
     */
    collectFor(
        timeout: number,
        type?: CmcdRequestType,
    ): Promise<CmcdCollectedRequest[]>;
}

export type CmcdRequestCollectorOptions = {
    /**
     * URLs whose POST requests are intercepted and stubbed with a synthetic
     * 204 response, instead of being passed through to the network.
     */
    eventTargetUrls?: readonly string[];

    /**
     * Override the default set of transport adapters. Defaults to
     * `[createXhrTransport(), createFetchTransport()]`, which patches
     * `XMLHttpRequest` and `fetch` on the current realm.
     */
    transports?: readonly CmcdTransportAdapter[];
};

export type CmcdCollectedRequest = {
    readonly request: HttpRequest;
    readonly type: CmcdRequestType;
    readonly reportingMode: 'query' | 'header' | 'event';
    readonly timestamp: number;
};

export type CmcdRequestType = ValueOf<typeof CMCD_REQUEST_TYPE>;
export const CMCD_REQUEST_TYPE = {
    MANIFEST: 'manifest',
    SEGMENT: 'segment',
    EVENT: 'event',
    UNKNOWN: 'unknown',
} as const;

export type CmcdTransportAdapter = {
    /**
     * Install the transport's interception hook. Returns a detach function
     * that restores the original transport. Called once per collector
     * `attach()`.
     *
     * For every outgoing request, the adapter normalizes the transport's
     * native request shape to an `HttpRequest` (reading the body if
     * necessary) and calls `deliver` with it. If `deliver` returns a
     * `Response`, the adapter short-circuits the real transport and
     * completes the request with that response. If `deliver` returns
     * `undefined`, the adapter forwards to the original transport.
     */
    attach(deliver: (request: HttpRequest) => Response | undefined): () => void;
};
```

### Behavior

- **Re-entrancy**: `attach()` called a second time without an intervening `detach()` is a no-op (doesn't double-patch).
- **`detach()`**: restores all transports and settles every pending `waitForRequests` waiter with `Error('Collector detached while waiting')`. Pending `collectFor` calls resolve immediately with whatever was collected by the time of detach.
- **`getRequests()`**: returns a defensive copy of the internal array so callers can mutate freely.
- **`waitForRequests(undefined, n)`**: matches any request type.
- **`waitForRequests` timeout**: default `15000` ms. On timeout, the returned promise rejects with `Error('Timeout waiting for N <type> CMCD request(s). Got M. Total collected: K.')`.
- **`collectFor`**: always resolves; on `detach()` it resolves early with whatever was collected so far. `type` defaults to "any". The promise resolves exactly once at `timeout` elapsed, regardless of how many requests arrive.
- **Collection filter**: only requests that actually carry CMCD data are stored. A request is considered CMCD-bearing if it has any `cmcd-*` header, contains a `CMCD=` query parameter (using the existing `CMCD_PARAM` constant), or matches an `eventTargetUrls` entry. Non-CMCD requests pass through silently.

## Transport adapters

### Default adapters

```ts
export function createXhrTransport(): CmcdTransportAdapter;
export function createFetchTransport(): CmcdTransportAdapter;
```

Each is a zero-argument factory. The factory returns an object implementing `CmcdTransportAdapter`. Implementation responsibilities:

**`createXhrTransport`**:

- Patch `XMLHttpRequest.prototype.open`, `setRequestHeader`, `send`.
- On `send`, build an `HttpRequest` value (`{ url, method, headers, body }`) and call `deliver`.
- If `deliver` returns a `Response`, synthesize completion on the XHR: set `status`, `statusText`, `readyState`, `responseURL`, `response`, `responseText`, and invoke `onload` / `onloadend` on a microtask.
- Returned detach function restores the three prototype methods to their originals.

**`createFetchTransport`**:

- Replace `globalThis.fetch` with a wrapper.
- Construct a `Request` from `(input, init)` and clone it.
- Normalize to `HttpRequest`: extract `url`, `method`, convert `Headers` to a lowercase-keyed `Record<string, string>`, and read the body (`await clone.arrayBuffer()` then decode as UTF-8, or pass through as `ArrayBuffer` if non-textual — resolved in the implementation plan).
- Call `deliver(httpRequest)`.
- If `deliver` returns a `Response`, resolve the fetch promise with that response.
- Otherwise, forward to the original `fetch` with the original `input`/`init`.
- Returned detach function restores the original `fetch` reference.

### Custom adapters

A consumer with a custom transport (e.g. `undici`) supplies a `CmcdTransportAdapter` and passes it via `options.transports`. The adapter normalizes its native request shape into an `HttpRequest` for `deliver` (including reading the body to a synchronous value), and translates any returned synthetic `Response` back into its transport-native completion.

## Classification & detection

```ts
const MANIFEST_EXTENSIONS = /\.(m3u8|mpd)(\?|$|\/)/i;
const SEGMENT_EXTENSIONS = /\.(m4s|m4v|m4a|mp4|ts|aac)(\?|$|\/)/i;

function classifyUrl(url: string, method: string): CmcdRequestType {
    if (method === 'POST') return CMCD_REQUEST_TYPE.EVENT;
    if (MANIFEST_EXTENSIONS.test(url)) return CMCD_REQUEST_TYPE.MANIFEST;
    if (SEGMENT_EXTENSIONS.test(url)) return CMCD_REQUEST_TYPE.SEGMENT;
    return CMCD_REQUEST_TYPE.UNKNOWN;
}

function detectReportingMode(
    url: string,
    headers: Record<string, string> | Headers | undefined,
    isEventTarget: boolean,
): 'query' | 'header' | 'event' | null {
    if (isEventTarget) return 'event';
    if (hasCmcdHeader(headers)) return 'header';
    return url.includes(`${CMCD_PARAM}=`) ? 'query' : null;
}
```

Regexes are module-level constants per the package's code-quality rules. The manifest regex covers both DASH (`.mpd`) and HLS (`.m3u8`); the segment regex covers the union of formats used by either source helper. The CMCD header check uses the spec prefix `cmcd-` (lowercased) so it catches `cmcd-object`, `cmcd-request`, `cmcd-session`, `cmcd-status`, and any future shard fields.

The reporting-mode detector returns `null` to indicate "no CMCD data found" — in that case the collector does not store the request.

## Event-target POST stubbing

For each request, if the URL starts with any entry in `eventTargetUrls` *and* the method is `POST`, the collector:

1. Stores the request as `{ type: 'event', reportingMode: 'event', ... }`.
2. Returns a synthetic `Response('', { status: 204 })` to short-circuit the transport.

For XHR, the adapter translates the `Response` into XHR completion as described above. The status code `204` (No Content) matches what the hls.js helper uses and matches what real CMCD event endpoints typically return.

## Testing

`libs/cmcd/test/CmcdRequestCollector.test.ts` covers:

- Captures a fetch request with `CMCD=` query
- Captures a fetch request with `Cmcd-Request` headers
- Captures an XHR request with `Cmcd-Object` headers
- Ignores a non-CMCD fetch request
- `getRequests(type)` filters correctly
- `waitForRequests` resolves when the threshold is reached
- `waitForRequests` rejects with a diagnostic message on timeout
- `collectFor` resolves after the timeout with whatever was collected (including zero)
- `collectFor` filters by type when one is supplied
- `detach()` restores patched `XMLHttpRequest.prototype` methods and the original `globalThis.fetch`, rejects in-flight `waitForRequests` waiters, and resolves in-flight `collectFor` waiters
- POST to an `eventTargetUrls` entry is stubbed with a 204 (verified via both fetch and XHR)
- A user-supplied custom adapter receives requests
- `// #region example` block: typical "configure player → wait for N segments → validate each" flow

Tests install minimal shims for `globalThis.XMLHttpRequest` and `globalThis.fetch` at the start of the suite and restore them in teardown. The collector is tested against these synthetic transports — there is no browser dependency. This matches the pattern other packages in this monorepo use for global-API-dependent code.

## Docs & changelog

- TSDoc on `CmcdRequestCollector` and its types, all marked `@public`.
- `@example` on `CmcdRequestCollector` referencing the `#region example` block via `{@includeCode ../test/CmcdRequestCollector.test.ts#example}`.
- Section in `libs/cmcd/README.md` introducing the helper with a short usage snippet.
- `libs/cmcd/CHANGELOG.md` entry under "Added": `CmcdRequestCollector` for test instrumentation.
- Minor version bump on `@svta/cml-cmcd` (new public API, no breaking changes).

## Tradeoffs accepted

- **Single class with two default adapters** rather than two separate classes. Most adopters don't know or care which transport their player uses; defaulting to both means `new CmcdRequestCollector().attach()` is the simplest possible API. Custom transports are the escape hatch.
- **Normalize to `HttpRequest` at capture time**, regardless of transport. Tests written against the collector are identical for fetch-based and XHR-based players — same header access (`r.request.headers['cmcd-request']`), same synchronous body access, same JSON-serializable shape. Costs ~30 lines of translation in `createFetchTransport` and forces the fetch wrapper to `await` the body once before delivering; both costs are fully internal to the collector. The Fetch-specific fields (`signal`, `redirect`, `mode`, `credentials`) are not preserved — none are needed for CMCD assertions.
- **Main barrel, not subpath export**. Slightly more bytes in worst-case bundlers, but zero build/config additions and a smaller cognitive footprint for adopters.
- **Two wait methods** — `waitForRequests` (rejects on timeout, for positive "expect N to happen" assertions) and `collectFor` (always resolves, for negative or upper-bound assertions). One small extra API entry, but call-site intent reads cleanly with either name and neither pattern needs `try/catch` or `sleep` workarounds. The two source PRs effectively each picked one of these; offering both fits both styles natively.

## Open implementation questions (for the plan)

- How `createFetchTransport` reads the body: `await clone.text()` (simple, fine for CMCD payloads which are textual) vs. `await clone.arrayBuffer()` (more general, lets the user decode as needed). Default: `text()` for textual content-types, `arrayBuffer()` otherwise.
- Exact shape of the XHR synthetic-response helper (multiple `Object.defineProperty` calls vs. a single proxy).
- Whether to expose `MANIFEST_EXTENSIONS` / `SEGMENT_EXTENSIONS` as public constants for users who want to extend them.
- Whether `CmcdTransportAdapter` should be exposed as `@public` (yes — needed for custom adapters) or `@alpha` (signals "this API may change as we add more transports").
- Whether `api-extractor` needs any changes given the new const-enum pattern type.

These are minor and can be resolved during implementation.
