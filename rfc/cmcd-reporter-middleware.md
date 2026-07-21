---
status: draft
---

# RFC: Report Middleware for `CmcdReporter`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-07-21 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No |

## Summary

Add an optional `middleware` array to `CmcdReporterConfig`. Each entry is a synchronous function that receives the assembled CMCD data for a single report, plus a context object describing where the report is headed, and returns either the (possibly modified) data to continue or `null` to cancel the report. The chain runs on both reporting paths: request-mode reports produced by `createRequestReport()` and event-mode reports headed to event targets.

```ts
const reporter = new CmcdReporter({
	enabledKeys: ['br', 'bl', 'sid', 'cid', 'v', 'sn'],
	middleware: [
		(data, ctx) => {
			// Never decorate license requests with CMCD
			if (ctx.reportingMode === CmcdReportingMode.REQUEST && ctx.request.url.includes('/license')) {
				return null
			}
			return data
		},
	],
})
```

## Motivation

`CmcdReporter` assembles report data and hands it to the wire with no interception point in between. Integrators have asked for two capabilities:

1. **Customize report data before sending.** Redact fields for specific collectors (e.g. strip `cid` from reports bound for a third-party analytics endpoint), enrich reports with custom keys, or normalize values to satisfy a backend.
2. **Cancel or ignore some reports entirely.** Skip CMCD decoration on non-media requests (license, DRM, telemetry), drop `TIME_INTERVAL` reports for unsampled sessions, or silence a chatty event type for one target without disabling it for others.

The existing extension points cannot do this:

- **The `requester` constructor argument** runs after batching and encoding. The body is already a newline-joined string of encoded reports, so customizing data means decoding and re-encoding, and cancelling a single event inside a batch is not possible without splitting the batch apart. It also never sees request-mode reports at all, since players send those through their own network stack.
- **Request-mode callers** can decline to call `createRequestReport()` for a given request, but that pushes CMCD policy out of the reporter and into every call site. Event mode has no equivalent: events fire from timers and internal state tracking, so there is no call site to guard.

A middleware chain at the point where each report is fully assembled but not yet encoded covers both capabilities on both paths with one small API.

## Guide-level explanation

### The contract

A middleware is a pure synchronous function:

```ts
(data: Cmcd, context: CmcdReportMiddlewareContext) => Cmcd | null
```

- Return the data object (the same one, mutated in place if you like, or a copy) to pass it to the next middleware and ultimately to the wire.
- Return `null` to cancel the report. The chain short-circuits and nothing is sent for this report.
- Middleware runs in array order.
- The `data` argument is a per-report copy, so mutating it never affects the reporter's persistent state or other targets' reports.

Middleware is registered once, in config:

```ts
import { CmcdEventType, CmcdReporter, CmcdReportingMode } from '@svta/cml-cmcd'

// Decide once per session whether to sample periodic reports
const sampled = Math.random() < 0.1

const reporter = new CmcdReporter({
	cid: 'content-123',
	enabledKeys: ['br', 'bl', 'mtp', 'sid', 'cid', 'v', 'sn'],
	eventTargets: [
		{
			url: 'https://collector.example.com/cmcd',
			events: [CmcdEventType.PLAY_STATE, CmcdEventType.TIME_INTERVAL],
			enabledKeys: ['sta', 'bl', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
		},
		{
			url: 'https://analytics.thirdparty.example/cmcd',
			events: [CmcdEventType.PLAY_STATE],
			enabledKeys: ['sta', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
		},
	],
	middleware: [
		// 1. Skip CMCD on license and key requests (request mode and rr events)
		(data, ctx) => ctx.request?.url.includes('/license') ? null : data,

		// 2. Redact the content ID from reports bound for the third-party collector
		(data, ctx) => {
			if (ctx.reportingMode === CmcdReportingMode.EVENT && ctx.config.url.includes('thirdparty')) {
				return { ...data, cid: undefined }
			}
			return data
		},

		// 3. Drop TIME_INTERVAL reports for 90% of sessions
		(data) => data.e === CmcdEventType.TIME_INTERVAL && !sampled ? null : data,
	],
})
```

### What middleware sees

The context is a discriminated union. Narrowing on `reportingMode` gives precise types per path:

- **Request mode**: `ctx.request` is the outgoing media request being decorated, and `ctx.config` exposes the reporter's request-report configuration (`version`, `enabledKeys`, `transmissionMode`).
- **Event mode**: `ctx.config` is the event target's configuration (`url`, `events`, `interval`, `batchSize`, `enabledKeys`, with defaults resolved), and `ctx.request` is the media request that triggered the event when one exists (currently `RESPONSE_RECEIVED` events recorded via `recordResponseReceived()`), otherwise `undefined`.

Because both branches expose `request`, URL-based media filtering needs no mode check: `ctx.request?.url.includes('/license')` covers request decoration and request-triggered events in one line.

Event identity lives in the data itself: `data.e` is populated before the chain runs, so filtering by event type is `data.e === CmcdEventType.TIME_INTERVAL`.

### What middleware cannot do

The reporter re-stamps `e` and assigns `sn` and `msd` after the chain completes. Middleware cannot change a report's event type (which would bypass a target's `events` filter), corrupt sequence numbering, or replay the media-start-delay marker. Middleware also cannot mutate the outgoing HTTP request through the context; it shapes CMCD data only.

## Reference-level explanation

### New types

One new type-only file, `CmcdReportMiddleware.ts`, exported from the package index via `export type *`:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * Middleware context for a request-mode report.
 *
 * @public
 */
export type CmcdRequestReportMiddlewareContext = {
	/** Identifies this as a request-mode report. */
	readonly reportingMode: typeof CMCD_REQUEST_MODE;

	/** The request report configuration. Do not mutate. */
	readonly config: Readonly<CmcdRequestReportConfig>;

	/** The outgoing request the report will be applied to. Do not mutate. */
	readonly request: HttpRequest;
}

/**
 * Middleware context for an event-mode report.
 *
 * @public
 */
export type CmcdEventReportMiddlewareContext = {
	/** Identifies this as an event-mode report. */
	readonly reportingMode: typeof CMCD_EVENT_MODE;

	/** The event target configuration the report is bound for. Do not mutate. */
	readonly config: Readonly<CmcdEventReportConfig>;

	/** The request that triggered the event, if any (e.g. rr events). Do not mutate. */
	readonly request: HttpRequest | undefined;
}

/**
 * Context passed to report middleware. Narrow via `reportingMode`.
 *
 * @public
 */
export type CmcdReportMiddlewareContext = CmcdRequestReportMiddlewareContext | CmcdEventReportMiddlewareContext;

/**
 * A middleware function that can customize or cancel a CMCD report
 * before it is sent. Return the data to continue the chain, or `null`
 * to cancel the report.
 *
 * @public
 */
export type CmcdReportMiddleware = (data: Cmcd, context: CmcdReportMiddlewareContext) => Cmcd | null
```

`CmcdReporterConfig` gains one optional key:

```ts
export type CmcdReporterConfig = CmcdRequestReportConfig & {
	// ...existing keys...

	/**
	 * Middleware applied to every report, in order, before encoding.
	 *
	 * @defaultValue `undefined`
	 */
	middleware?: CmcdReportMiddleware[];
}
```

### Chain execution

The reporter normalizes the array (defensive copy, default `[]`) and runs it through a private helper:

```ts
private applyMiddleware(data: Cmcd, context: CmcdReportMiddlewareContext): Cmcd | null {
	let current = data
	for (const middleware of this.config.middleware) {
		const result = middleware(current, context)
		if (result == null) {
			return null
		}
		current = result
	}
	return current
}
```

A nullish return (including a forgotten `return`) cancels the report. This is deliberate: for TypeScript users the declared return type makes a missing return a compile error, and for JavaScript users cancellation is a loud failure mode (reports visibly stop) rather than a silent no-op middleware.

### Request-mode flow (`createRequestReport`)

1. Build the report skeleton (cloned request, empty `customData.cmcd`), exactly as today.
2. Existing guard: if request reporting is disabled (`enabledKeys` empty) or the request has no URL, return the bare report. Middleware does not run when no report is being made.
3. Merge persistent data with per-call data. No sequence number is assigned yet.
4. Run the chain with `{ reportingMode: 'request', config, request }`, where `request` is the caller's original argument and `config` is a `{ version, enabledKeys, transmissionMode }` view built once in the constructor (so internals like `eventTargets` and the middleware array itself are not reachable through the context).
5. On `null`: return the bare report. No query param or headers are applied, `customData.cmcd` stays empty, and neither `sn` nor `msd` is consumed.
6. Otherwise: stamp `sn`, attach `msd` if it has not yet been sent on the request path, prepare, encode, and attach via query or headers exactly as today.

### Event-mode flow (`recordTargetEvent`)

1. Existing guard: the target's `events` filter runs first, before any middleware work.
2. Build the per-target item: `{ ...persistentData, ...eventData, e: type, ts }`. No sequence number is assigned yet. Each target gets a fresh copy, so an event fanning out to three targets runs the chain three times with different `ctx.config`, and mutations for one target never leak into another's report.
3. Run the chain with `{ reportingMode: 'event', config: targetConfig, request: triggeringRequest }`. The target config passed is the reporter's normalized config for that target, so defaults like `interval` and `batchSize` are resolved. The triggering request is threaded from `recordResponseReceived()` through a private parameter on the internal record path; the public `recordEvent()` signature is unchanged, and all other event sources (state-change events fired by `update()`, `TIME_INTERVAL` timers, direct `recordEvent()` calls) pass `undefined`.
4. On `null`: nothing is queued. No `sn` is consumed and `msd` is not marked sent.
5. Otherwise: re-stamp `e` with the original event type, assign `sn`, attach `msd` (once per target), and push to the target's queue. Batching, retry, and re-queue-on-failure behavior are untouched because middleware ran before the queue.

### Reporter-owned fields

`e`, `sn`, and `msd` are stamped after the chain completes. Values middleware writes to those keys are overwritten. `ts` is ordinary report data and middleware may override it.

### Cancellation guarantees

- A cancelled report consumes no sequence number. Wire `sn` values stay contiguous per event target and for the request path.
- A cancelled report does not consume `msd`. The media-start-delay marker rides the next successful report for that target.

### Interaction with state-change dedup

State-change dedup (`lastEmitted`) commits in `recordEvent()` before per-target fan-out. Middleware is downstream and wire-level:

- Cancelling a state-change report, even for every target, does not roll back the dedup baseline. The state transition still happened; middleware only suppressed its transmission.
- Mutating a tracked field (e.g. `sta`) in one target's report does not poison dedup for other targets or future events.

Canonical state belongs to `update()` and `recordEvent()`. Middleware shapes what goes on the wire.

### Interaction with `enabledKeys`

Middleware runs before encoding, so the `enabledKeys` allowlist (and the encoder's force-include rules for required event fields) still applies to middleware output:

- Keys added by middleware must be present in the relevant `enabledKeys` (top-level for request mode, per-target for event mode) to reach the wire. Middleware can inspect `ctx.config.enabledKeys`.
- Keys removed by middleware stay removed.

This keeps `enabledKeys` as the single wire allowlist and prevents middleware from accidentally leaking keys a target was never configured to receive.

### Error handling

Middleware exceptions propagate to the caller: `createRequestReport()`, `recordEvent()`, `update()`, or, for `TIME_INTERVAL` events, the interval timer context. The library does not swallow them because both silent alternatives are worse:

- Fail-open (send the unmodified report) is dangerous: a throwing redaction middleware would leak exactly the data it exists to remove.
- Fail-closed (silently drop the report) makes data loss undebuggable.

Documentation states the rule plainly: middleware must not throw. Wrap risky logic in try/catch and choose fail-open (return the data) or fail-closed (return `null`) explicitly.

### Bundle and performance impact

- The new types erase at compile time. The runtime additions are one small private method and a for-loop call in two existing methods.
- No new module-scope code and no new runtime exports, so tree-shaking is unaffected.
- Integrators that do not configure middleware pay one empty-array iteration per report.

### Testing

New coverage in `CmcdReporter.test.ts`, following the existing mock-requester patterns:

- Mutate and cancel on both paths, including chain ordering and short-circuit.
- `sn` continuity across cancels on both paths (no gaps).
- `msd` survives a cancelled carrier and rides the next report.
- `e` re-stamp when middleware tampers with it.
- Per-target isolation (mutation for target A does not leak into target B) and per-target cancel via `ctx.config.url`.
- Context correctness: `reportingMode`, `config` contents, `request` populated from `recordResponseReceived()` and `undefined` for state/interval events.
- Middleware-added keys remain subject to `enabledKeys`.
- Error propagation from both paths.
- A `#region` example block wired into the TSDoc via `{@includeCode}`.

## Drawbacks

- **API surface**: four new public types and a config key that every future change must respect.
- **Footgun potential**: middleware can degrade payloads (e.g. stripping keys a collector expects). The reporter-owned-field re-stamping and `enabledKeys` filtering bound the damage to data quality; structural validity and sequence integrity are protected.
- **Error propagation reaches timer contexts**: a throwing middleware on a `TIME_INTERVAL` event surfaces as an unhandled error. The alternative (swallowing) was judged worse; see Error handling.
- **A second way to shape data**: simple cases are already served by `enabledKeys` and `update()`. The docs must be clear that middleware is for per-report, per-destination decisions that config cannot express.

## Rationale and alternatives

- **Single hook (`onReport` callback)**: nearly identical type surface, but composition becomes the integrator's job (hand-threading `null` checks between concerns) and there is no path to shared, reusable middleware. The array subsumes the single-function case: `middleware: [fn]`.
- **Koa-style `reporter.use(fn)` with `next()`**: the onion model earns its keep when middleware wraps async operations. With synchronous data transforms, `next()` is ceremony, and runtime registration adds mutable state the class otherwise avoids. Everything else in `CmcdReporter` is configured at construction.
- **Per-batch interception** (middleware sees the event array before POST): enables cross-event logic but interacts badly with retry (failed batches re-queue, so middleware would re-run on retransmission) and cancelled events would have already consumed sequence numbers. Deferred; see Future possibilities.
- **Async middleware**: `createRequestReport()` is called inline in player request pipelines and must stay synchronous, and the driving use cases are all synchronous decisions. Anything async (remote config, consent state) can feed the reporter via `update()` or a config refresh before reports fire.
- **Per-target middleware arrays on `CmcdEventReportConfig`**: expressible today by checking `ctx.config` inside a reporter-level middleware. Adding per-target registration as sugar remains open; see Unresolved questions.
- **Do nothing (use `requester`)**: rejected for the reasons in Motivation. It runs post-encoding, post-batching, and never sees request-mode reports.

## Prior art

- **Shaka Player** request/response filters (`NetworkingEngine.registerRequestFilter`): an ordered list of functions that may modify or reject outgoing requests. The closest player-ecosystem precedent for this proposal's shape.
- **hls.js** `xhrSetup`/`fetchSetup` and **dash.js** request modifiers: single-callback request customization hooks; the "single hook" alternative considered above.
- **axios interceptors**: ordered arrays of transform functions registered against a client instance; return the (possibly replaced) value to continue.
- **Express/Koa middleware**: the naming inspiration, though this proposal deliberately drops `next()` since there is nothing async to wrap.

## Unresolved questions

1. **Error stance**: this RFC proposes propagating middleware exceptions. Should the reporter instead fail closed (drop the report) on throw? Propagation is honest and debuggable but surfaces integrator bugs in timer contexts.
2. **Naming**: `middleware` vs `interceptors` vs `modifiers`. `middleware` matches the request's framing and the ordered-chain semantics; `interceptors` matches axios precedent.
3. **Per-target registration**: should `CmcdEventReportConfig` also accept a `middleware` array in v1, or is `ctx.config` discrimination enough until asked for?
4. **Triggering request on custom events**: should the public `recordEvent()` accept an associated `HttpRequest` so custom and error events can carry request context into middleware? This RFC keeps the plumbing private and only `recordResponseReceived()` populates it.

## Future possibilities

- Async middleware for event mode only, if a concrete use case appears that `update()` cannot serve.
- A per-batch stage (e.g. `batchMiddleware`) for cross-event aggregation, dedup, or compression decisions.
- A small library of shared middleware (session samplers, PII redactors, key normalizers) published as reusable functions, enabled by the pure-function contract.
- Runtime registration (`use()`/unregister) if dynamic policy changes without reporter reconstruction become a real need.

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**
