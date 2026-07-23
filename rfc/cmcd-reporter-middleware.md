---
status: draft
---

# RFC: Report Transforms for `CmcdReporter`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-07-21 (revised 2026-07-22) |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No |

> **Revision note**: the first draft of this RFC proposed a single reporter-level
> `middleware` array applied to both reporting paths. Community review
> ([dash.js feedback on per-target `rr` filtering](https://github.com/streaming-video-technology-alliance/common-media-library/pull/390))
> and a closer look at the existing config conventions reshaped the proposal
> into per-placement `transform` functions. See Rationale and alternatives for
> why. The file name retains the original working name.

## Summary

Add an optional `transform` function to the request-report configuration and to each event target configuration. A transform is a synchronous function that receives the assembled CMCD data for a single report, plus the associated media request when one exists, and returns either the (possibly modified) data to continue or `null` to cancel the report.

Placement determines scope, mirroring how `enabledKeys` already works: the top-level `transform` applies to request-mode reports produced by `createRequestReport()`, and each event target's `transform` applies to event reports bound for that target.

```ts
const reporter = new CmcdReporter({
	enabledKeys: ['br', 'bl', 'sid', 'cid', 'v', 'sn'],
	// Request mode: never decorate license requests with CMCD
	transform: (data, request) => request.url.includes('/license') ? null : data,
	eventTargets: [
		{
			url: 'https://collector.example.com/cmcd',
			events: [CmcdEventType.PLAY_STATE, CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: ['sta', 'url', 'rc', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
			// Event mode, this target only: drop rr reports for non-segment responses
			transform: (data, request) => {
				if (data.e === CmcdEventType.RESPONSE_RECEIVED && request?.customData?.requestType !== 'segment') {
					return null
				}
				return data
			},
		},
	],
})
```

## Motivation

`CmcdReporter` assembles report data and hands it to the wire with no interception point in between. Integrators have asked for two capabilities:

1. **Customize report data before sending.** Redact fields for specific collectors (e.g. strip `cid` from reports bound for a third-party analytics endpoint), enrich reports with custom keys, or normalize values to satisfy a backend.
2. **Cancel or ignore some reports entirely.** Skip CMCD decoration on non-media requests (license, DRM, telemetry), drop `TIME_INTERVAL` reports for unsampled sessions, or silence an event for one target without disabling it for others.

A concrete case raised during review: dash.js lets each reporting target opt into `RESPONSE_RECEIVED` events for selected request types only (segment-only, manifest-only). Two targets may intentionally share a collector URL while differing in events, keys, batch sizes, and response filters. Today dash.js must run a separate `CmcdReporter` instance per target to express this, fanning every `update()` and `recordEvent()` call out to N reporters with N timers and duplicated session state. Per-target transforms let one reporter own all targets, and they keep player-specific taxonomy (like request types) in the player: dash.js compiles its own settings into a filter function, and this library stays agnostic.

The existing extension points cannot do any of this:

- **The `requester` constructor argument** runs after batching and encoding. The body is already a newline-joined string of encoded reports, so customizing data means decoding and re-encoding, and cancelling a single event inside a batch is not possible without splitting the batch apart. It also never sees request-mode reports at all, since players send those through their own network stack.
- **Request-mode callers** can decline to call `createRequestReport()` for a given request, but that pushes CMCD policy out of the reporter and into every call site. Event mode has no equivalent: events fire from timers and internal state tracking, so there is no call site to guard.

## Guide-level explanation

### The contract

A transform is a pure synchronous function:

```ts
(data: Cmcd, request: HttpRequest | undefined) => Cmcd | null
```

- Return the data object (the same one, mutated in place if you like, or a copy) to send it.
- Return `null` to cancel the report. Nothing is sent.
- The `data` argument is a per-report copy, so mutating it never affects the reporter's persistent state or other targets' reports.
- The `request` argument is the associated media request: for request-mode reports, the request being decorated (always present); for event reports, the request that triggered the event when one exists (`RESPONSE_RECEIVED` events recorded via `recordResponseReceived()`), otherwise `undefined`.

### Placement determines scope

Transforms follow the same placement convention as `enabledKeys`:

| Placement | Applies to |
|---|---|
| `CmcdReporterConfig.transform` (top level) | Request-mode reports (`createRequestReport()`) |
| `CmcdEventReportConfig.transform` (per target) | Event reports bound for that target |

There is deliberately no single registration point spanning both paths. Event identity lives in the data itself (`data.e`), the target's own config is in scope where the transform is written, and anything else a transform needs can be closed over.

```ts
// Cross-cutting policy is a shared function referenced from each placement
const sampled = Math.random() < 0.1
const sampleIntervals = (data: Cmcd): Cmcd | null =>
	data.e === CmcdEventType.TIME_INTERVAL && !sampled ? null : data

const reporter = new CmcdReporter({
	cid: 'content-123',
	enabledKeys: ['br', 'bl', 'mtp', 'sid', 'cid', 'v', 'sn'],
	eventTargets: [
		{
			url: 'https://collector.example.com/cmcd',
			events: [CmcdEventType.PLAY_STATE, CmcdEventType.TIME_INTERVAL],
			enabledKeys: ['sta', 'bl', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
			transform: sampleIntervals,
		},
		{
			url: 'https://analytics.thirdparty.example/cmcd',
			events: [CmcdEventType.PLAY_STATE],
			enabledKeys: ['sta', 'sid', 'v', 'e', 'ts', 'sn'],
			// Redact the content ID from everything bound for this collector
			transform: (data) => ({ ...data, cid: undefined }),
		},
	],
})
```

Composing multiple concerns at one placement is ordinary function composition, which integrators own:

```ts
transform: (data, request) => {
	const scrubbed = scrubPii(data, request)
	return scrubbed === null ? null : sampleIntervals(scrubbed)
}
```

For request-type filtering that is expressible in pure CMCD terms, the `ot` (object type) key distinguishes manifests from media segments without reaching into player internals, when the player populates it: `data.ot === 'm'` for manifests. Player-specific taxonomy rides `request.customData`, as in the Summary example.

### What transforms cannot do

The reporter re-stamps `e` and assigns `sn` and `msd` after the transform runs. A transform cannot change a report's event type (which would bypass a target's `events` filter), corrupt sequence numbering, or replay the media-start-delay marker. Transforms also cannot mutate the outgoing HTTP request; they shape CMCD data only.

## Reference-level explanation

### New types

One new type-only file, `CmcdReportTransform.ts`, exported from the package index via `export type *`:

```ts
import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'

/**
 * Transforms a request-mode CMCD report before it is applied to the
 * outgoing request. Return the data to continue, or `null` to skip
 * CMCD decoration for this request.
 *
 * @public
 */
export type CmcdRequestReportTransform = (data: Cmcd, request: HttpRequest) => Cmcd | null

/**
 * Transforms an event-mode CMCD report before it is queued for its
 * target. `request` is the media request that triggered the event when
 * one exists (e.g. `RESPONSE_RECEIVED`), otherwise `undefined`. Return
 * the data to continue, or `null` to cancel the report.
 *
 * @public
 */
export type CmcdEventReportTransform = (data: Cmcd, request: HttpRequest | undefined) => Cmcd | null
```

The config types each gain one optional key:

```ts
export type CmcdRequestReportConfig = CmcdReportConfig & {
	// ...existing keys...

	/**
	 * Transform applied to each request-mode report before encoding.
	 *
	 * @defaultValue `undefined`
	 */
	transform?: CmcdRequestReportTransform;
}

export type CmcdEventReportConfig = CmcdReportConfig & {
	// ...existing keys...

	/**
	 * Transform applied to each of this target's event reports before
	 * queueing.
	 *
	 * @defaultValue `undefined`
	 */
	transform?: CmcdEventReportTransform;
}
```

`CmcdReporterConfig` inherits the request-mode `transform` from `CmcdRequestReportConfig`, exactly as it inherits `enabledKeys` and `transmissionMode`.

A nullish return (including a forgotten `return`) cancels the report. This is deliberate: for TypeScript users the declared return type makes a missing return a compile error, and for JavaScript users cancellation is a loud failure mode (reports visibly stop) rather than a silently inert transform.

### Request-mode flow (`createRequestReport`)

1. Build the report skeleton (cloned request, empty `customData.cmcd`), exactly as today.
2. Existing guard: if request reporting is disabled (`enabledKeys` empty) or the request has no URL, return the bare report. The transform does not run when no report is being made.
3. Merge persistent data with per-call data. No sequence number is assigned yet.
4. Invoke the top-level `transform`, if configured, with the merged data and the caller's original request argument (not the internal clone, so mutating the `request` parameter cannot alter the outgoing report).
5. On `null`: return the bare report. No query param or headers are applied, `customData.cmcd` stays empty, and neither `sn` nor `msd` is consumed.
6. Otherwise: stamp `sn`, attach `msd` if it has not yet been sent on the request path, prepare, encode, and attach via query or headers exactly as today.

### Event-mode flow (`recordTargetEvent`)

1. Existing guard: the target's `events` filter runs first, before any transform work.
2. Build the per-target item: `{ ...persistentData, ...eventData, e: type, ts }`. No sequence number is assigned yet. Each target gets a fresh copy, so an event fanning out to three targets invokes each target's transform with its own copy, and mutations for one target never leak into another's report.
3. Invoke the target's `transform`, if configured, with the item and the triggering request. The triggering request is threaded from `recordResponseReceived()` through a private parameter on the internal record path; the public `recordEvent()` signature is unchanged, and all other event sources (state-change events fired by `update()`, `TIME_INTERVAL` timers, direct `recordEvent()` calls) pass `undefined`.
4. On `null`: nothing is queued. No `sn` is consumed and `msd` is not marked sent.
5. Otherwise: re-stamp `e` with the original event type, assign `sn`, attach `msd` (once per target), and push to the target's queue. Batching, retry, and re-queue-on-failure behavior are untouched because the transform ran before the queue.

Config normalization copies each target's `transform` into the normalized target config alongside its other fields.

### Reporter-owned fields

`e`, `sn`, and `msd` are stamped after the transform completes. Values a transform writes to those keys are overwritten. `ts` is ordinary report data and a transform may override it.

### Cancellation guarantees

- A cancelled report consumes no sequence number. Wire `sn` values stay contiguous per event target and for the request path.
- A cancelled report does not consume `msd`. The media-start-delay marker rides the next successful report for that target.

### Interaction with state-change dedup

State-change dedup (`lastEmitted`) commits in `recordEvent()` before per-target fan-out. Transforms are downstream and wire-level:

- Cancelling a state-change report, even for every target, does not roll back the dedup baseline. The state transition still happened; the transform only suppressed its transmission.
- Mutating a tracked field (e.g. `sta`) in one target's report does not poison dedup for other targets or future events.

Canonical state belongs to `update()` and `recordEvent()`. Transforms shape what goes on the wire.

### Interaction with `enabledKeys`

Transforms run before encoding, so the `enabledKeys` allowlist (and the encoder's force-include rules for required event fields) still applies to transform output:

- Keys added by a transform must be present in the `enabledKeys` at the same placement to reach the wire.
- Keys removed by a transform stay removed.

This keeps `enabledKeys` as the single wire allowlist and prevents a transform from accidentally leaking keys a target was never configured to receive. Note that data minimization is already a per-placement concern in this API: a key that must never reach any destination should simply not be enabled anywhere, which is also why a both-paths global hook is unnecessary for that job.

### Error handling

Transform exceptions propagate to the caller: `createRequestReport()`, `recordEvent()`, `update()`, or, for `TIME_INTERVAL` events, the interval timer context. The library does not swallow them because both silent alternatives are worse:

- Fail-open (send the unmodified report) is dangerous: a throwing redaction transform would leak exactly the data it exists to remove.
- Fail-closed (silently drop the report) makes data loss undebuggable.

Documentation states the rule plainly: transforms must not throw. Wrap risky logic in try/catch and choose fail-open (return the data) or fail-closed (return `null`) explicitly.

### Forward compatibility

If transforms later need more context than the associated request, the library can add a trailing parameter without breaking existing implementations, since callbacks with fewer declared parameters remain assignable. This is the escape hatch that keeps today's minimal signature safe to ship.

### Bundle and performance impact

- The new types erase at compile time. The runtime addition is a conditional function call at two existing sites.
- No new module-scope code and no new runtime exports, so tree-shaking is unaffected.
- Integrators that do not configure transforms pay one undefined-check per report.

### Testing

New coverage in `CmcdReporter.test.ts`, following the existing mock-requester patterns:

- Mutate and cancel on both paths.
- Placement isolation: the top-level transform never runs for event reports, and target transforms never run for request-mode reports.
- Two targets sharing a collector URL with different transforms behave independently.
- `sn` continuity across cancels on both paths (no gaps).
- `msd` survives a cancelled carrier and rides the next report.
- `e` re-stamp when a transform tampers with it.
- Per-target isolation: mutation for target A does not leak into target B's report.
- `request` argument: the caller's request in request mode, the triggering request for `recordResponseReceived()`, and `undefined` for state-change and `TIME_INTERVAL` events.
- Transform-added keys remain subject to `enabledKeys`.
- Error propagation from both paths.
- A `#region` example block wired into the TSDoc via `{@includeCode}`.

## Drawbacks

- **Cross-cutting policy has no single registration point.** A concern that applies everywhere must be referenced from the top level and from each target. Mitigations: shared function references (see Guide-level), and the observation that whole-session data minimization is already served by `enabledKeys` placement and by not feeding sensitive values into `update()`.
- **One function per placement.** Integrators composing several concerns at one placement write the composition themselves. A `composeTransforms()` helper can ship later as a separate tree-shakeable export if demand appears.
- **Footgun potential**: a transform can degrade payloads (e.g. stripping keys a collector expects). The reporter-owned-field re-stamping and `enabledKeys` filtering bound the damage to data quality; structural validity and sequence integrity are protected.
- **Error propagation reaches timer contexts**: a throwing transform on a `TIME_INTERVAL` event surfaces as an unhandled error. The alternative (swallowing) was judged worse; see Error handling.
- **A second way to shape data**: simple cases are already served by `enabledKeys` and `update()`. The docs must be clear that transforms are for per-report, per-destination decisions that static config cannot express.

## Rationale and alternatives

- **A reporter-level `middleware` array spanning both paths (this RFC's first draft)**: rejected after review, for three reasons. First, it broke the config's existing placement convention: top-level `enabledKeys` governs request mode and per-target `enabledKeys` governs that target, and there is no both-paths global key anywhere in the API. Second, serving two report shapes with one function forced a discriminated-union context object (`reportingMode`, mode-dependent fields, readonly config views) that per-placement registration makes unnecessary; placement encodes everything the union encoded, and a transform closes over the config it sits in. Third, dash.js review surfaced the case of two targets sharing a collector URL with different filtering needs, which a global chain cannot discriminate cleanly.
- **Arrays of transforms at each placement**: an ordered-array contract earns its keep when configs compose third-party units the author did not write (Rollup plugins, Babel, Redux middleware). The realistic consumers here are players compiling their own settings into a single function, so the array would buy contract surface (ordering, short-circuit, empty-array semantics) without a composition ecosystem to serve. Plain function composition covers multi-concern placements.
- **Koa-style `reporter.use(fn)` with `next()`**: the onion model earns its keep when middleware wraps async operations. With synchronous data transforms, `next()` is ceremony, and runtime registration adds mutable state the class otherwise avoids. Everything else in `CmcdReporter` is configured at construction.
- **Per-batch interception** (a hook seeing the event array before POST): enables cross-event logic but interacts badly with retry (failed batches re-queue, so the hook would re-run on retransmission) and cancelled events would have already consumed sequence numbers. Deferred; see Future possibilities.
- **Async transforms**: `createRequestReport()` is called inline in player request pipelines and must stay synchronous, and the driving use cases are all synchronous decisions. Anything async (remote config, consent state) can feed the reporter via `update()` or a config refresh before reports fire.
- **Do nothing (use `requester`)**: rejected for the reasons in Motivation. It runs post-encoding, post-batching, and never sees request-mode reports.

## Prior art

- **Shaka Player** request/response filters (`NetworkingEngine.registerRequestFilter`): functions that may modify or reject outgoing requests before transmission.
- **hls.js** `xhrSetup`/`fetchSetup` and **dash.js** request modifiers: single-callback request customization hooks registered in config, the closest precedent for this proposal's per-placement single-function shape.
- **axios interceptors**: ordered arrays of transform functions registered against a client instance. Considered and not followed; see Rationale and alternatives.
- **dash.js CMCD reporting filters**: per-target opt-in of `RESPONSE_RECEIVED` events by request type, the concrete consumer for per-target transforms.

## Unresolved questions

1. **Error stance**: this RFC proposes propagating transform exceptions. Should the reporter instead fail closed (drop the report) on throw? Propagation is honest and debuggable but surfaces integrator bugs in timer contexts.
2. **Triggering request on custom events**: should the public `recordEvent()` accept an associated `HttpRequest` so custom and error events can carry request context into transforms? This RFC keeps the plumbing private and only `recordResponseReceived()` populates it.

## Future possibilities

- A `composeTransforms()` helper exported as a standalone, tree-shakeable function if shared transforms become common.
- Async transforms for event mode only, if a concrete use case appears that `update()` cannot serve.
- A per-batch stage for cross-event aggregation, dedup, or compression decisions.
- Richer transform context added as a non-breaking trailing parameter.

## Revision history

- **2026-07-21 (v1)**: initial draft proposing a reporter-level `middleware` array applied to both reporting paths, with a discriminated-union context object.
- **2026-07-22 (v2)**: reshaped into per-placement `transform` functions following dash.js review feedback (per-target `rr` filtering, same-URL targets) and the `enabledKeys` placement-symmetry argument. Resolved former open questions on naming (`transform`) and per-target registration (yes, it is the design).

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**
