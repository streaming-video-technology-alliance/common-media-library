---
status: implemented
implemented-in: @svta/cml-cmcd@2.5.0
implementation-plan: plans/cmcd-report-transforms/
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
import { CmcdEventType, CmcdReporter } from '@svta/cml-cmcd'

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
				const customData = request?.customData as { requestType?: string } | undefined
				if (data.e === CmcdEventType.RESPONSE_RECEIVED && customData?.requestType !== 'segment') {
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
(data: Cmcd, request: CmcdTransformRequest | undefined) => Cmcd | null
```

- Return the data object (the same one, mutated in place if you like, or a copy) to send it.
- Return `null` to cancel the report. Nothing is sent.
- The `data` argument is a per-report copy, so mutating it never affects the reporter's persistent state or other targets' reports. This holds for nested values too: arrays such as `br` and `ec` are copied, so `data.ec.push(...)` is safe. See Report data copying.
- The `request` argument is the associated media request: for request-mode reports, the request being decorated (always present); for event reports, the request that triggered the event when one exists (`RESPONSE_RECEIVED` events recorded via `recordResponseReceived()`), otherwise `undefined`. It is context for the decision, not something to change. See The request is context only.

### The request is context only

The request belongs to the caller, which may still be using it after the call returns, so a transform must not mutate it. This is expressed in the type rather than by copying: `CmcdTransformRequest` is a read-only view of `HttpRequest` whose members are all `readonly` and whose `customData` is `Readonly<Record<string, unknown>>`.

Typing `customData` as an opaque record rather than `any` is what makes the constraint real. `HttpRequest` defaults its `customData` to `any`, and a deeply-readonly mapped type over `any` is still `any`, so a readonly `HttpRequest` would reject `request.url = …` while silently permitting `request.customData.player.kind = …`, which is the mutation that actually reaches the outgoing report. With `unknown` values, nested writes are rejected too. The cost is that reading a player field needs bracket access or a cast:

```ts
transform: (data, request) =>
	request?.customData?.['requestType'] === 'segment' ? data : null
```

v6 lets an adopter buy that cost back by describing their own `customData`; see Typing the player's `customData`. The opaque record remains the default, so the constraint above is what applies unless the adopter opts out of it deliberately.

Two limits are stated rather than hidden. A mutable body such as `FormData` or `URLSearchParams` carries mutating methods that no type can block, and JavaScript callers get no compile-time enforcement at all. Mutating the request through either route is unsupported, and because the outgoing report shallow-clones the request, the report may reflect it. The contract is that the request is immutable, not that the library makes it impossible to mutate.

### Typing the player's `customData`

Every type in the transform chain takes a type parameter for the player's `customData`, defaulting to `Record<string, unknown>`:

```ts
export type CmcdTransformRequest<C = Record<string, unknown>> = Readonly<Omit<HttpRequest, 'customData' | 'headers'>> & {
	readonly headers?: Readonly<Record<string, string>>;
	readonly customData?: Readonly<C>;
}

export type CmcdRequestReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C>) => Cmcd | null
export type CmcdEventReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C> | undefined) => Cmcd | null
```

`CmcdRequestReportConfig<C>`, `CmcdEventReportConfig<C>`, `CmcdReporterConfig<C>`, and `CmcdReporter<C>` thread the same parameter, all with the same default, so nothing already written changes meaning.

The parameter is inferred from the configuration rather than declared per transform. Annotating one standalone transform as `CmcdEventReportTransform<PlayerData>` fixes `C` for the whole config object, and the inferred `C` reaches the top-level `transform` slot as well, so its `request.customData` is typed without a second annotation. `new CmcdReporter<PlayerData>({ … })` states it explicitly instead. Either way the cost is one annotation per reporter.

`CmcdReporter<C>` is load-bearing, not decorative: TypeScript rejects type parameters on a constructor declaration (`TS1092`), so a class-level parameter is the only place `C` can be introduced such that a config object literal infers it.

This closes an asymmetry rather than adding a capability. `recordResponseReceived()` is already generic over the request's `customData`, so the call site preserves the player's type while the transform reading that same request saw every value as `unknown`.

Two things follow from `C` being a promise the transforms rely on.

`customData` is applied through `DeepReadonly<C>`, not `Readonly<C>`. `Readonly` stops at the top level, so `request.customData.nested.field = …` would compile, which is the mutation The request is context only exists to prevent, and which the opaque-record default had always rejected because `unknown` cannot be indexed into. Applying the parameter shallowly would have made describing a nested shape a trade of mutation safety for typed reads. `DeepReadonly` lives in `@svta/cml-utils` since nothing about it is CMCD-specific.

The reporter's methods constrain their request against `C`, so a request the configured transforms could not read is rejected at the call site rather than reaching them and reading `undefined`, whose usual symptom is a silently cancelled report rather than an error. The constraint has to be inert when `C` is left at its default, because the direct forms of it break existing callers whose `customData` is declared with `interface` rather than `type`: interfaces get no implicit index signature and so are not assignable to `Record<string, unknown>`, which would partially undo what the generic `recordResponseReceived()` shipped to fix. `CmcdReporterCustomData<C>` resolves to `any` exactly when `C` is the default and to `C` otherwise:

```ts
export type CmcdReporterCustomData<C> = Record<string, unknown> extends C ? any : C
```

The cost is that both signatures carry the helper, which every adopter reading the API sees. That is accepted rather than hidden: a `C` the reporter does not enforce is a type that lies, and the alternative was documenting the lie.

### Placement determines scope

Transforms follow the same placement convention as `enabledKeys`:

| Placement | Applies to |
|---|---|
| `CmcdReporterConfig.transform` (top level) | Request-mode reports (`createRequestReport()`) |
| `CmcdEventReportConfig.transform` (per target) | Event reports bound for that target |

There is deliberately no single registration point spanning both paths. Event identity lives in the data itself (`data.e`), the target's own config is in scope where the transform is written, and anything else a transform needs can be closed over.

```ts
import type { Cmcd } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdReporter } from '@svta/cml-cmcd'

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
import type { Cmcd, CmcdTransformRequest } from '@svta/cml-cmcd'

// An integrator-owned redaction step, defined here so the composition is runnable
const scrubPii = (data: Cmcd, request: CmcdTransformRequest | undefined): Cmcd | null =>
	request?.url.includes('/private/') ? null : { ...data, cid: undefined }

const transform = (data: Cmcd, request: CmcdTransformRequest | undefined): Cmcd | null => {
	const scrubbed = scrubPii(data, request)
	return scrubbed === null ? null : sampleIntervals(scrubbed)
}
```

For request-type filtering that is expressible in pure CMCD terms, the `ot` (object type) key distinguishes manifests from media segments without reaching into player internals, when the player populates it: `data.ot === 'm'` for manifests. Player-specific taxonomy rides `request.customData`, as in the Summary example.

### What transforms cannot do

The reporter re-stamps `e` and assigns `sn` and `msd` after the transform runs. A transform cannot change a report's event type (which would bypass a target's `events` filter), corrupt sequence numbering, or replay the media-start-delay marker. Transforms also cannot mutate the outgoing HTTP request; they shape CMCD data only.

A transform also cannot strip a key that CTA-5004-B requires for the event being reported. Every event requires `e` and `ts`; state-change events additionally require the field whose value they signal (`sta`, `pr`, `cid`, `bg`, `br`), `ce` requires `cen`, `e` (error) requires `ec`, and `rr` requires `url`. If a transform removes one of these, *or replaces it with a value the encoder drops*, the reporter restores the value it held before the transform ran, so a transform cannot emit a report that the library's own `validateCmcdEvents()` would reject.

Required keys cannot be filtered away either: they are force-included after the `enabledKeys` allowlist, so omitting one from `enabledKeys` does not suppress it. The only way to keep a destination from receiving the field an event carries is to leave that event out of the target's `events`.

## Reference-level explanation

### New types

Three new type-only files, each named for the type it exports and re-exported from the package index via `export type *`. Each takes a type parameter for the player's `customData`, defaulting to `Record<string, unknown>`; see Typing the player's `customData`.

```ts
// CmcdTransformRequest.ts
import type { HttpRequest } from '@svta/cml-utils'

/**
 * The media request handed to a report transform, as a read-only view.
 * Context only: it belongs to the caller and must not be mutated.
 *
 * @public
 */
export type CmcdTransformRequest<C = Record<string, unknown>> = Readonly<Omit<HttpRequest, 'customData' | 'headers'>> & {
	readonly headers?: Readonly<Record<string, string>>;
	readonly customData?: DeepReadonly<C>;
}
```

```ts
// CmcdRequestReportTransform.ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'

/**
 * Transforms a request-mode CMCD report before it is applied to the
 * outgoing request. Return the data to continue, or `null` to skip
 * CMCD decoration for this request.
 *
 * @public
 */
export type CmcdRequestReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C>) => Cmcd | null
```

```ts
// CmcdEventReportTransform.ts
import type { Cmcd } from './Cmcd.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'

/**
 * Transforms an event-mode CMCD report before it is queued for its
 * target. `request` is the media request that triggered the event when
 * one exists (e.g. `RESPONSE_RECEIVED`), otherwise `undefined`. Return
 * the data to continue, or `null` to cancel the report.
 *
 * @public
 */
export type CmcdEventReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C> | undefined) => Cmcd | null
```

The config types each gain one optional key, and thread the same parameter through to it:

```ts
export type CmcdRequestReportConfig<C = Record<string, unknown>> = CmcdReportConfig & {
	// ...existing keys...

	/**
	 * Transform applied to each request-mode report before encoding.
	 *
	 * @defaultValue `undefined`
	 */
	transform?: CmcdRequestReportTransform<C>;
}

export type CmcdEventReportConfig<C = Record<string, unknown>> = CmcdReportConfig & {
	// ...existing keys...

	/**
	 * Transform applied to each of this target's event reports before
	 * queueing.
	 *
	 * @defaultValue `undefined`
	 */
	transform?: CmcdEventReportTransform<C>;
}
```

`CmcdReporterConfig<C>` inherits the request-mode `transform` from `CmcdRequestReportConfig<C>`, exactly as it inherits `enabledKeys` and `transmissionMode`, and passes `C` on to its `eventTargets`. `CmcdReporter<C>` takes the same parameter so the constructor's config type is nameable, and constrains `createRequestReport()` and `recordResponseReceived()` against it via `CmcdReporterCustomData<C>`.

A nullish return (including a forgotten `return`) cancels the report. This is deliberate: for TypeScript users the declared return type makes a missing return a compile error, and for JavaScript users cancellation is a loud failure mode (reports visibly stop) rather than a silently inert transform.

### Request-mode flow (`createRequestReport`)

1. Build the report skeleton (cloned request, empty `customData.cmcd`), exactly as today.
2. Existing guard: if request reporting is disabled (`enabledKeys` empty) or the request has no URL, return the bare report. The transform does not run when no report is being made.
3. Merge persistent data with per-call data. No sequence number is assigned yet. When a transform is configured, nested values in the merged data are copied; see Report data copying.
4. Invoke the top-level `transform`, if configured, with the merged data and the caller's original request argument, typed as the read-only `CmcdTransformRequest` view (see The request is context only).
5. On `null`: return the bare report. No query param or headers are applied, `customData.cmcd` stays empty, and neither `sn` nor `msd` is consumed.
6. Otherwise: stamp `sn`, attach `msd` if it has not yet been sent on the request path, prepare, encode, and attach via query or headers exactly as today.

### Event-mode flow (`recordTargetEvent`)

1. Existing guard: the target's `events` filter runs first, before any transform work.
2. Build the per-target item: `{ ...persistentData, ...eventData, e: type, ts }`. No sequence number is assigned yet. Each target gets a fresh copy, so an event fanning out to three targets invokes each target's transform with its own copy, and mutations for one target never leak into another's report. When the target has a transform, nested values in that copy are copied too; see Report data copying.
3. Invoke the target's `transform`, if configured, with the item and the triggering request. The triggering request is threaded from `recordResponseReceived()` through a private parameter on the internal record path; the public `recordEvent()` signature is unchanged, and all other event sources (state-change events fired by `update()`, `TIME_INTERVAL` timers, direct `recordEvent()` calls) pass `undefined`. The invocation is isolated per target; see Error handling.
4. On `null`: nothing is queued. No `sn` is consumed and `msd` is not marked sent.
5. Otherwise: restore any key the event requires that the transform removed, re-stamp `e` with the original event type, assign `sn`, attach `msd` (once per target), and push to the target's queue. Batching, retry, and re-queue-on-failure behavior are untouched because the transform ran before the queue.

Config normalization copies each target's `transform` into the normalized target config alongside its other fields.

### Report data copying

The merged report data handed to a transform is a shallow spread of the persistent store and the per-call data. A shallow spread is not enough on its own: 16 CMCD keys are array-typed (`br`, `bl`, `mtp`, `ec`, `nor`, and so on), so the copy would share those array references with the reporter's persistent store and with every other target's report for the same event. A transform doing `data.ec.push(...)` would then mutate the persistent array, and the mutation would surface in reports for targets that have no transform at all.

Before invoking a transform, the reporter therefore copies nested values as well:

- Array values are copied.
- Object values, and object elements inside arrays, are `SfItem`s; each is copied along with its `params` record. The copy preserves the prototype, because `prepareCmcdData`, `CMCD_FORMATTER_MAP`, `validateCmcdValues`, and the structured-field encoder all branch on `instanceof SfItem`.

This is complete rather than best-effort, because the CMCD value space is bounded by its own types. `CmcdValue` and `CmcdCustomValue` admit only primitives, `SfItem<primitive>`, and arrays of those, and `SfItem` is `{ value, params }` with a flat `params` record. There is no arbitrary nesting for a general-purpose deep clone to discover.

The copy runs only where a transform is configured. Reports on a path with no transform take exactly the shallow spread they take today, and a target without a transform pays nothing even when a sibling target has one.

Measured against the implementation on a representative v2 segment report (six array-valued keys, one of them holding an `SfItem` with params): the copy pass costs roughly 200ns in isolation, and enabling a transform adds roughly 400ns end to end including the transform call itself, against a full `createRequestReport` cost of roughly 8.5µs. That is about 5% of the report path, which is dominated by structured-field encoding and URL work. `structuredClone` on the same payload costs roughly 3.2µs, about 40% of the report path, and does not even produce a correct result; see Rationale and alternatives.

### Reporter-owned fields

`e`, `sn`, and `msd` are stamped after the transform completes. Values a transform writes to those keys are overwritten.

`ts` and the other keys CTA-5004-B requires for the event type are *conditionally* reporter-owned: a transform may change their values, but it may not remove them. If the transform returns data in which a required key is missing while it was present before the transform ran, the reporter restores the pre-transform value. The required keys are `e` and `ts` for every event, the signalled field for state-change events (`sta`, `pr`, `cid`, `bg`, `br`), `cen` for `ce`, `ec` for the error event, and `url` for `rr`. This mirrors what the library already does elsewhere: `prepareCmcdData` force-includes the required state field even when `enabledKeys` would filter it out, so these keys are already treated as non-negotiable rather than integrator-controlled.

Restoration is deliberately not invention. If a required key was already absent before the transform ran (for example an error event recorded without `ec`), the report was already non-conformant and the reporter does not fabricate a value; that is a caller bug, unchanged by this proposal.

### Cancellation guarantees

- A cancelled report consumes no sequence number. Wire `sn` values stay contiguous per event target and for the request path.
- A cancelled report does not consume `msd`. The media-start-delay marker rides the next successful report for that target.

### Interaction with state-change dedup

State-change dedup (`lastEmitted`) commits in `recordEvent()` before per-target fan-out. Transforms are downstream and wire-level:

- Cancelling a state-change report, even for every target, does not roll back the dedup baseline. The state transition still happened; the transform only suppressed its transmission.
- Mutating a tracked field (e.g. `sta`) in one target's report does not poison dedup for other targets or future events.
- A *throwing* transform does not roll back the baseline either, which is precisely why the throw must not abort the fan-out. Per-target isolation (see Error handling) keeps the committed transition deliverable to every other target, so the un-rollback-able baseline never strands a transition that no target received.

Canonical state belongs to `update()` and `recordEvent()`. Transforms shape what goes on the wire.

### Interaction with `enabledKeys`

Transforms run before encoding, so the `enabledKeys` allowlist (and the encoder's force-include rules for required event fields) still applies to transform output:

- Keys added by a transform must be present in the `enabledKeys` at the same placement to reach the wire.
- Keys removed by a transform stay removed, unless the event requires them; see Reporter-owned fields.

This keeps `enabledKeys` as the single wire allowlist and prevents a transform from accidentally leaking keys a target was never configured to receive. Note that data minimization is already a per-placement concern in this API: a key that must never reach any destination should simply not be enabled anywhere, which is also why a both-paths global hook is unnecessary for that job.

### Error handling

Transform exceptions propagate to the caller: `createRequestReport()`, `recordEvent()`, `update()`, or, for `TIME_INTERVAL` events, the interval timer context. The library does not swallow them because both silent alternatives are worse:

- Fail-open (send the unmodified report) is dangerous: a throwing redaction transform would leak exactly the data it exists to remove.
- Fail-closed (silently drop the report) makes data loss undebuggable.

Documentation states the rule plainly: transforms must not throw. Wrap risky logic in try/catch and choose fail-open (return the data) or fail-closed (return `null`) explicitly.

Propagation is nevertheless isolated per target. A throwing transform must not deprive *other* targets of a report, and in event mode a naive propagation does exactly that: `recordEvent()` commits the dedup baseline before fan-out, so if the throw aborts iteration, targets ordered after the throwing one never see the transition, and the player's retry of the same state is then suppressed by dedup. Because target order is fixed by configuration, one consistently throwing transform would starve every target after it for the lifetime of the session, not just once.

This applies to every place the reporter fans out to targets, not just `recordEvent()`. `start()` fires the initial `TIME_INTERVAL` event synchronously per target, so it needs the same treatment: without it, a throwing transform on an earlier target aborts the loop and later targets never have their intervals armed, reporting nothing for the whole session, and a retried `start()` fails on the same target again. The timer is armed before the initial event fires, so a throw leaves the target in the state a successful `start()` would rather than silently disabling it.

The event-mode contract is therefore:

- Each target's transform is invoked in isolation. A throw is caught, that target's report is dropped, and the remaining targets are still processed.
- After the fan-out completes, queued batches are processed as usual, and only then is the error re-thrown to the caller. If several targets throw for the same event, the first is re-thrown; a throwing transform is already a documented contract violation, and reporting one of them is enough to surface the bug without introducing an aggregate error type.
- The throwing target consumes no sequence number and does not mark `msd` sent, exactly as if its transform had returned `null`.

Request mode needs no equivalent: there is a single transform and a single report, `sn` and `msd` are not consumed until after the transform returns, and the exception simply reaches the `createRequestReport()` caller with no reporter state disturbed.

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
- Required-key restoration, one case per required-key family: `ts` on any event, the signalled field on each state-change event (`sta`, `pr`, `cid`, `bg`, `br`), `cen` on `ce`, `ec` on the error event, and `url` on `rr`. Each case asserts the restored report passes `validateCmcdEventReport()`.
- Restoration on substitution as well as removal: an empty string (`url: ''`), an empty list (`ec: []`), and a non-finite `ts`. Plus the inverse guard, that a transform legitimately setting `bg: false` on a backgrounded-mode event is *not* reverted, since falsiness alone must not count as unusable.
- `start()` isolation: with a throwing transform on the first of two interval targets, the second still receives its initial event and has its interval armed, and the error still reaches the caller.
- Required keys absent before the transform are not fabricated by it.
- Per-target error isolation: with a throwing transform on the first of two targets, the second target still receives the report, the throw still reaches the caller, and a subsequent distinct state transition is still delivered. A regression test for the starvation case: after a throw, the healthy target's report count is non-zero.
- Per-target isolation: mutation for target A does not leak into target B's report, including nested mutation (`data.ec.push(...)` in target A's transform, asserted against a target B that has no transform).
- Nested mutation does not corrupt the persistent store: after a transform pushes onto an array value, a later report for the same target carries the original array, not a doubly-appended one.
- Nested `SfItem` values: mutating `params` on an element inside an array value does not affect the reporter's copy.
- `request` argument: the caller's request in request mode, the triggering request for `recordResponseReceived()`, and `undefined` for state-change and `TIME_INTERVAL` events.
- Transform-added keys remain subject to `enabledKeys`.
- Error propagation from both paths.
- A `#region` example block wired into the TSDoc via `{@includeCode}`.

## Drawbacks

- **Cross-cutting policy has no single registration point.** A concern that applies everywhere must be referenced from the top level and from each target. Mitigations: shared function references (see Guide-level), and the observation that whole-session data minimization is already served by `enabledKeys` placement and by not feeding sensitive values into `update()`.
- **One function per placement.** Integrators composing several concerns at one placement write the composition themselves. A `composeTransforms()` helper can ship later as a separate tree-shakeable export if demand appears.
- **Footgun potential**: a transform can degrade payloads (e.g. stripping optional keys a collector expects). Reporter-owned-field re-stamping, required-key restoration, and `enabledKeys` filtering bound the damage to data quality: sequence integrity is protected, and a transform cannot produce a report that `validateCmcdEvents()` rejects. It can still produce a structurally valid report that is analytically useless.
- **Error propagation reaches timer contexts**: a throwing transform on a `TIME_INTERVAL` event surfaces as an unhandled error. The alternative (swallowing) was judged worse; see Error handling.
- **Per-target error isolation adds a try/catch per target per event.** This is the cost of not letting one integrator's throwing transform starve unrelated targets. It also means a throw is reported to the caller slightly later than it occurs, after the remaining targets and the queue have been processed.
- **The read-only request view costs ergonomics, not runtime.** `customData` values are `unknown`, so reading a player field takes bracket access or a cast where `any` previously allowed dot access. In exchange the constraint is real rather than advisory for TypeScript users. It cannot cover a mutable `FormData` or `URLSearchParams` body, and it does nothing for JavaScript callers.
- **Copying nested values costs roughly 5% of a report** wherever a transform is configured, and charges every transform user for a hazard that only transforms mutating nested values would hit. The alternative was to declare nested mutation unsupported, which was rejected: the failure mode is a report for a target with no transform of its own, plus permanent corruption of the persistent store, with no compile-time signal and no plausible way for the person debugging it to trace the cause.
- **A second way to shape data**: simple cases are already served by `enabledKeys` and `update()`. The docs must be clear that transforms are for per-report, per-destination decisions that static config cannot express.

## Rationale and alternatives

- **A reporter-level `middleware` array spanning both paths (this RFC's first draft)**: rejected after review, for three reasons. First, it broke the config's existing placement convention: top-level `enabledKeys` governs request mode and per-target `enabledKeys` governs that target, and there is no both-paths global key anywhere in the API. Second, serving two report shapes with one function forced a discriminated-union context object (`reportingMode`, mode-dependent fields, readonly config views) that per-placement registration makes unnecessary; placement encodes everything the union encoded, and a transform closes over the config it sits in. Third, dash.js review surfaced the case of two targets sharing a collector URL with different filtering needs, which a global chain cannot discriminate cleanly.
- **Arrays of transforms at each placement**: an ordered-array contract earns its keep when configs compose third-party units the author did not write (Rollup plugins, Babel, Redux middleware). The realistic consumers here are players compiling their own settings into a single function, so the array would buy contract surface (ordering, short-circuit, empty-array semantics) without a composition ecosystem to serve. Plain function composition covers multi-concern placements.
- **Koa-style `reporter.use(fn)` with `next()`**: the onion model earns its keep when middleware wraps async operations. With synchronous data transforms, `next()` is ceremony, and runtime registration adds mutable state the class otherwise avoids. Everything else in `CmcdReporter` is configured at construction.
- **Per-batch interception** (a hook seeing the event array before POST): enables cross-event logic but interacts badly with retry (failed batches re-queue, so the hook would re-run on retransmission) and cancelled events would have already consumed sequence numbers. Deferred; see Future possibilities.
- **Async transforms**: `createRequestReport()` is called inline in player request pipelines and must stay synchronous, and the driving use cases are all synchronous decisions. Anything async (remote config, consent state) can feed the reporter via `update()` or a config refresh before reports fire.
- **Do nothing (use `requester`)**: rejected for the reasons in Motivation. It runs post-encoding, post-batching, and never sees request-mode reports.
- **Shallow copy with nested mutation declared unsupported**: rejected. It keeps the hot path free but makes the documented isolation guarantee conditional on a caveat, and the failure mode when the caveat is missed is severe and undiagnosable (a sibling target with no transform emits another target's mutation, and the reporter's persistent arrays are corrupted for the rest of the session). A deeply readonly parameter type would enforce it at compile time for TypeScript users, but it gives JavaScript users nothing and revokes the in-place mutation ergonomic for everyone.
- **Runtime enforcement of request immutability**: a recursive read-only `Proxy` was measured and rejected. It works completely, blocking writes at any depth without copying and leaving reads ergonomic, but it costs roughly 1670ns per report against a roughly 8.5µs report path, about 20%, because players build a fresh request per media object so the proxy cannot be cached across calls. That is four times the cost of the nested-data copy for a strictly less severe problem: the request is caller-owned, so a mutation is the integrator's own code changing its own object, whereas the data object is reporter-owned and a leak there corrupts library state. Deep-copying the request was rejected too, because player `customData` is arbitrary (class instances, DOM nodes, functions) and a generic copy either drops prototypes or needs an unbounded bespoke walker. Freezing the caller's request was rejected as a side effect on data the library does not own.
- **`structuredClone` for nested values**: rejected, and not merely on cost. `structuredClone` discards prototypes, so every `SfItem` value would come back as a plain object and silently fail the `instanceof SfItem` branches in `prepareCmcdData`, `CMCD_FORMATTER_MAP`, and the encoder, changing what goes on the wire. It is also roughly 40% of a report versus roughly 5% for the targeted copy, and the value space is bounded by `CmcdValue` and `CmcdCustomValue`, so there is nothing for a general-purpose clone to find that the targeted copy misses.

## Prior art

- **Shaka Player** request/response filters (`NetworkingEngine.registerRequestFilter`): functions that may modify or reject outgoing requests before transmission.
- **hls.js** `xhrSetup`/`fetchSetup` and **dash.js** request modifiers: single-callback request customization hooks registered in config, the closest precedent for this proposal's per-placement single-function shape.
- **axios interceptors**: ordered arrays of transform functions registered against a client instance. Considered and not followed; see Rationale and alternatives.
- **dash.js CMCD reporting filters**: per-target opt-in of `RESPONSE_RECEIVED` events by request type, the concrete consumer for per-target transforms.

## Unresolved questions

Both questions were resolved in favor of the stance proposed above when the RFC was accepted; see Final Decision.

1. **Error stance** (resolved: propagate). Transform exceptions propagate to the caller rather than being swallowed. Both silent alternatives are worse: fail-open leaks the data a redaction transform exists to remove, and fail-closed makes data loss undebuggable. Documentation states that transforms must not throw.
2. **Triggering request on custom events** (resolved: keep private). Only `recordResponseReceived()` populates the triggering request, threaded through a private internal path. The public `recordEvent()` signature is unchanged. A public associated-request parameter can be added later without a breaking change if a concrete use case appears.

## Future possibilities

- A `composeTransforms()` helper exported as a standalone, tree-shakeable function if shared transforms become common.
- Async transforms for event mode only, if a concrete use case appears that `update()` cannot serve.
- A per-batch stage for cross-event aggregation, dedup, or compression decisions.
- Richer transform context added as a non-breaking trailing parameter.

## Revision history

- **2026-07-21 (v1)**: initial draft proposing a reporter-level `middleware` array applied to both reporting paths, with a discriminated-union context object.
- **2026-07-22 (v2)**: reshaped into per-placement `transform` functions following dash.js review feedback (per-target `rr` filtering, same-URL targets) and the `enabledKeys` placement-symmetry argument. Resolved former open questions on naming (`transform`) and per-target registration (yes, it is the design).
- **2026-07-27 (v3)**: accepted as proposed in v2. Recorded the resolution of both unresolved questions (propagate exceptions, keep triggering-request plumbing private).
- **2026-07-27 (v4)**: three correctness fixes found while implementing v3, all verified against a working implementation. Transforms can no longer remove keys CTA-5004-B requires for the event (v3 protected only `e`, `sn`, and `msd`, so stripping `sta` from a `ps` event produced a report the library's own validator rejects). Event-mode exception propagation is now isolated per target (v3's unqualified propagation aborted the fan-out, and because the dedup baseline commits first, one throwing transform permanently starved every target ordered after it). Nested values in the report copy are now copied as well, making v3's isolation guarantee true as written rather than true only for top-level keys; a shallow spread let `data.ec.push(...)` corrupt the persistent store and surface in reports for targets with no transform. Also corrected the Drawbacks claim that structural validity was already protected, and made the examples self-contained.

## Revision history (continued)

- **2026-07-27 (v5)**: three corrections from review of the implementation PR, each reproduced against working code. Required-key restoration now covers substitution as well as removal, because a type-valid but unusable value (`url: ''`) was dropped downstream and left the report as invalid as a missing key; the predicate deliberately treats `false` as usable so a legitimate `bg: false` is not reverted. `start()` now isolates its per-target initial `TIME_INTERVAL` event, which v4's `emitEvent()` isolation did not cover, so a throwing transform no longer leaves later targets without armed intervals for the session. The request parameter is narrowed to a read-only `CmcdTransformRequest` view, replacing v3's claim that mutating the request cannot affect the outgoing report: the report shallow-clones the request, so nested `customData` mutation did reach it.

  v5 also corrects two statements. Required keys are force-included after the `enabledKeys` filter, so the earlier advice to keep a key from a destination by omitting it from `enabledKeys` does not work for them; leaving the event out of the target's `events` is the way. And `prepareCmcdData` had never force-included `ec` or `url`, so a target whose `enabledKeys` omitted them emitted an invalid report with no transform involved at all; that gap is fixed alongside, which is what makes the restoration guarantee true end to end rather than only up to the queue.

- **2026-07-27 (v6)**: the transform signature gains a type parameter for the player's `customData`, defaulting to `Record<string, unknown>`. v5 narrowed the request to a read-only view whose `customData` values are `unknown`, which made mutation a compile error but also made every read bracket access. Separately, `recordResponseReceived()` had already become generic over the request's `customData`, so the call site kept the player's type while the transform reading that same request lost it. v6 threads one parameter through `CmcdTransformRequest`, both transform types, the three config types, and `CmcdReporter`, inferred from the configuration so that annotating a single transform types the request in all of them. Purely additive: every parameter defaults, so v5's opaque record is still what an un-annotated adopter gets.

  Two consequences of `C` were caught in review of the implementation PR, both fixed there rather than deferred. `Readonly<C>` is shallow, so supplying a nested `C` reopened exactly the nested-write hole v5 closed by using `unknown` values; `customData` is now `DeepReadonly<C>`, a new utility in `@svta/cml-utils`. And the reporter's methods accepted a request with any `customData`, so a reporter given a concrete `C` and handed a request that did not satisfy it compiled, and the transform read `undefined` where its type promised a value. Both methods now constrain their request against `C` through `CmcdReporterCustomData<C>`, which is inert when `C` is left at its default so that callers whose `customData` is an `interface` rather than a `type` are unaffected. See Typing the player's `customData`.

## Final Decision

**Decision:** Accepted as proposed in v2, with the two correctness fixes recorded in v4. Both unresolved questions resolve to the stance the RFC proposed: transform exceptions propagate to the caller (isolated per target, per v4), and the triggering request is threaded privately so only `recordResponseReceived()` populates it.

**Post-acceptance amendments:** v4 tightens three parts of the contract that implementation showed to be unsound. None changes the shape of the API, and none invalidates the review that led to acceptance: required-key restoration only removes a way to emit invalid reports, per-target error isolation only prevents one target's throwing transform from silently starving the others, and copying nested values only makes the isolation guarantee v3 already advertised actually hold. All three are strictly more conservative than v3.

v5 continues in the same direction, with one exception worth flagging to reviewers. Two of its three changes are again strictly more conservative (restoration covering substitution, and `start()` getting the isolation `emitEvent()` already had). The third is a genuine narrowing of what the proposal promises: v3 said mutating the `request` parameter could not affect the outgoing report, and that was false for nested `customData`. Rather than deep-copying caller-owned data on every report, v5 states that the request is context only and must not be mutated, and encodes that in a read-only parameter type. Adopters who relied on the old wording as a guarantee should read The request is context only, since the enforcement is compile-time for TypeScript and contractual for everyone else.

v6 is the first amendment that widens rather than narrows, and it does so without changing what any existing declaration means. Adding a defaulted type parameter to the transform chain is invisible to code that does not use it, and the ergonomic cost v5 introduced (bracket access on every `customData` read) is now opt-out rather than mandatory. The parameter is enforced rather than merely declared: it is applied deeply, so it does not weaken v5's no-mutation guarantee, and both reporter methods constrain their request against it, so a `C` the transforms rely on cannot be contradicted at the call site. Both of those started as gaps in the first draft of the implementation and were closed in review.

**Rationale:** The per-placement single-function shape was confirmed by the concrete consumer during review. dash.js ([#390](https://github.com/streaming-video-technology-alliance/common-media-library/pull/390)) verified that one function per target is sufficient to express `sendResponseReceivedForRequestTypes`, which was the case that motivated reshaping the proposal away from a global middleware array, and that composing further target-specific rules into a single function is acceptable. That removes the last open concern about dropping the array contract. On the two remaining questions, the proposed stances were kept because the alternatives are strictly worse and both are reversible in a non-breaking way: swallowing transform exceptions would either leak the data a redaction transform exists to remove or make data loss undebuggable, and a public associated-request parameter on `recordEvent()` can be added later if a use case appears, whereas removing one could not.

**Date:** 2026-07-27
