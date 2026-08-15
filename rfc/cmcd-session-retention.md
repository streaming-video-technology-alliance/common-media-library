---
status: accepted
---

# RFC: Session retention in `CmcdReporter`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-08-12 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No (one behavioral change, see Drawbacks) |

## Summary

`CmcdReporter` retains the state of past sessions in a bounded window, so a report that completes after a `sid` change is built from and accounted against the session it belongs to. Today the reporter keeps one live session and resets it in place, so anything still in flight at the change (a media request, a queued batch) is either relabeled with the new `sid` or lost.

Three pieces of this are public:

- `sessionRetention`, a new option on `CmcdReporterConfig`, bounds how many ended sessions the reporter keeps alongside the current one. Default `2`, and `0` disables retention.
- Requests returned by `createRequestReport()` carry a frozen provenance record (`CmcdRequestProvenance`, holding the issuing session's `sid`, the `cid` in effect when the request was issued, and `data`: the request's per-call data encoded as a CMCD string) on `customData`, keyed by an exported symbol, `CMCD_REQUEST_PROVENANCE`, rather than a string name. It collides with nothing and never appears in string-keyed enumeration or JSON output, and a player whose requests cross a serialization boundary can carry the record explicitly and restore it.
- `recordResponseReceived()` resolves the session a response belongs to by the provenance record's `sid` alone, and either attributes the event to that session or drops the event. It never relabels a report with the current `sid`, and it reports the record's `cid` in place of the session's current one.

```ts
import { CmcdEventType, CmcdReporter } from '@svta/cml-cmcd'

const reporter = new CmcdReporter({
	sid: 's1',
	cid: 'c1',
	enabledKeys: ['br', 'bl', 'sid', 'cid', 'v', 'sn'],
	eventTargets: [
		{
			url: 'https://collector.example.com/cmcd',
			events: [CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: ['url', 'rc', 'sid', 'cid', 'e', 'ts', 'sn'],
		},
	],
})

// Decorated while s1 is current. The returned request carries session
// provenance under a symbol key on customData.
const request = reporter.createRequestReport({ url: 'https://cdn.example.com/v/seg-42.m4s' })

// The content changes and the player rotates the session.
reporter.update({ sid: 's2' })

// The response completes late. The event reports under s1: s1's sid
// label, s1's next sequence number, s1's frozen data snapshot.
reporter.recordResponseReceived({ status: 200, request })
```

## Motivation

CTA-5004-B scopes its session semantics to the `sid`: `sn` is a contiguous sequence per session per target, `msd` is sent once per session per mode, and HTTP 410 silences a target URL for the remainder of the session that received it. A reporter that keeps only the current session cannot honor any of that for work that outlives a session change, and session changes happen while work is in flight: content transitions land while segment requests are outstanding, and event batches wait in queues or retry after failures.

Review of [PR #416](https://github.com/streaming-video-technology-alliance/common-media-library/pull/416), which fixed the session-integrity issues [#408](https://github.com/streaming-video-technology-alliance/common-media-library/issues/408), [#409](https://github.com/streaming-video-technology-alliance/common-media-library/issues/409), and [#410](https://github.com/streaming-video-technology-alliance/common-media-library/issues/410), reproduced the failures:

- A response completing after `update({ sid: 's2' })` was reported with `sid=s2`, s2's sequence number, and s2's data snapshot, for a request that ran entirely under s1.
- A delayed 410 from a batch sent under s1 disposed s2's target.
- A batch that failed with 429 re-queued into whichever session was current at settlement.
- A request whose `transform` cancelled decoration stores no `sid`, so its late response had no provenance at all and fell through to the current session.
- Session keys are caller-chosen strings. After `s1 → s2 → s1`, a response to a request issued in the first s1 resolved to the second s1, a different session with its own counters and gates.
- A partial batch queued under the old session could be evicted unsent, and the archived data snapshot shared arrays with the caller, so mutating a previously passed `bl` array rewrote a not-yet-sent s1 report.

Per-session state objects fix all of these with one structure instead of six guards. The structure itself is internal, but it needs one config option (how many ended sessions to keep), one provenance record on returned requests (which session issued this), and defined resolution semantics on `recordResponseReceived()`. Those are public API, and repo process requires public API to go through an RFC. This document is that proposal. The `msd` validation and 410-scoping corrections in #416 are spec-compliance bug fixes and are not part of it.

## Guide-level explanation

### Late responses report under their own session

Nothing needs to be configured. A request decorated by `createRequestReport()` remembers the session it was issued in. If the response arrives after a `sid` change, the `RESPONSE_RECEIVED` event carries the issuing session's `sid`, consumes that session's next sequence number, and draws snapshot keys (`cid`, custom keys, and the rest) from that session's data as it stood at the transition. The Summary example shows the flow.

If the issuing session has already been evicted, the event is dropped. A dropped response is silent, consistent with the reporter's tolerance conventions: no exception, no console noise.

### Bounding the window

`sessionRetention` sets how many ended sessions the reporter keeps, in addition to the current one:

```ts
import { CmcdReporter } from '@svta/cml-cmcd'

// Retain no ended sessions. A response that completes after a sid
// change is dropped, never attributed and never relabeled.
const strict = new CmcdReporter({ sessionRetention: 0 })

// Never evict. Also retains every session's unsent queues for the life
// of the reporter, so memory grows with each session change.
const unbounded = new CmcdReporter({ sessionRetention: Infinity })
```

The default of `2` keeps the current session plus two ended ones, which covers a run of short sessions in quick succession, for example ad pods that rotate `sid` per break.

### A session change sends what the old session still holds

Changing `sid` drains the ended session before anything is evicted. Queued event reports that never filled a batch are sent at the transition, labeled and sequenced by the session that produced them. Timers are untouched and keep ticking into the new session.

### The archived snapshot is frozen

At the transition, the ended session's data is detached from every reference the caller holds. Mutating an array passed to an earlier `update()` no longer changes what an archived session's late reports say. Within the live session, values handed to `update()` are stored by reference, unchanged from today.

### The provenance record

Provenance rides the decorated request itself, on `customData`, keyed by the exported symbol `CMCD_REQUEST_PROVENANCE` rather than a string name. A symbol key cannot collide with a player's own `customData` keys, never shows up in `Object.keys`, `for...in`, or `JSON.stringify` output, and cannot be touched by accident: reaching it takes a deliberate import.

The value is a frozen record, `CmcdRequestProvenance`. `sid` names the issuing session and is the attribution key. `cid` is the content id in effect when the request was issued: a `RESPONSE_RECEIVED` event reports it in place of the session's current value, because `cid` can change mid-session between a request and its response, and the response's meaning in later analysis belongs to the content the request was about. `data` is the per-call data the request was created with, encoded as a CMCD string and captured before the key filter and transform run, so it rides every returned request, decorated or not; a late `RESPONSE_RECEIVED` event rebuilds the caller's request-time inputs from it, and they survive any boundary the record is carried across. The record is the only attribution key, and it is constructible: a hand-built `{ sid }` attributes to the session it names, while a record naming a `sid` the reporter does not retain drops the response instead of mis-attributing.

The record survives the ways players ordinarily copy requests. Where symbol keys die (JSON, structured clone), the exported symbol is the bridge, and the record itself is JSON-safe: attribution reads the `sid` value, never object identity, so a revived plain-object copy attributes exactly:

```ts
import { CMCD_REQUEST_PROVENANCE } from '@svta/cml-cmcd'

const request = reporter.createRequestReport({ url: 'https://cdn.example.com/v/seg-42.m4s' })

// Spread and Object.assign copy symbol-keyed properties, so ordinary
// clones keep the record.
const clone = { ...request, headers: { ...request.headers } }

// JSON and structured clone drop symbol keys, so carry the record
// explicitly across such a boundary and restore it afterward. The
// revived copy attributes identically to the original reference.
const payload = JSON.parse(JSON.stringify({
	request,
	provenance: request.customData[CMCD_REQUEST_PROVENANCE],
}))
payload.request.customData[CMCD_REQUEST_PROVENANCE] = payload.provenance

// A request restored this way attributes exactly and keeps its
// request-time inputs, which ride the record as encoded per-call
// data. One that lost its provenance is dropped: the record is the
// only attribution key.
```

The record never reaches the wire in either transmission mode: every encode path starts from string-keyed enumeration, so a symbol-keyed member is invisible to it.

## Reference-level explanation

### The session object

Everything the spec scopes to a session moves into one internal object, created fresh on every `sid` change:

```ts
type CmcdSession<C> = {
	sid: string
	provenance: CmcdRequestProvenance  // frozen { sid, cid? }, re-minted on cid change
	data: Cmcd                         // persistent data store for this session
	msd: number                        // NaN until a valid update({ msd })
	lastEmitted: Partial<Pick<Cmcd, StateField>>
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTarget>
	requestTarget: CmcdTarget
}
```

Per-target state (`sn`, the `msd` gate, queues, 410 disposal) lives inside the session, so a late report consumes its own session's counters and a delayed 410 disposes its own session's target. Timers live on the reporter and tick across transitions.

Retained sessions are keyed by `sid`, insertion-ordered oldest first. Session identity is the `sid` itself: CTA-5004-B expects a `sid` to be a GUID unique to one playback session, so uniqueness is the caller's contract rather than something the reporter manufactures. Reusing a `sid` violates that contract; the reporter then replaces the retained namesake at the newest map position (`Map.set` alone would keep the stale insertion position and let oldest-first eviction reach the current session), the replaced session's remaining state dies as if evicted, and its late responses relabel onto the replacement.

### `sessionRetention`

```ts
/**
 * The number of ended sessions the reporter retains state for, in
 * addition to the current one. Retained sessions let a response that
 * completes after a `sid` change report under the session that issued
 * its request, with that session's data snapshot and sequence numbers.
 * `0` retains nothing, so stale responses are dropped. `Infinity`
 * never evicts, which also retains every session's unsent report
 * queues.
 *
 * @defaultValue 2
 */
sessionRetention?: number;
```

The input is type-checked, never type-coerced: only `number` values are considered, so numeric strings and booleans fall back to the default instead of converting, and a `Symbol` falls back instead of throwing under arithmetic coercion. A `number` is then normalized: it is floored, and the result is used if it is `0` or greater, `Infinity` included. Anything else (`NaN`, negative numbers) falls back to the default of `2`.

### The provenance record

`createRequestReport()` stamps the session's frozen provenance record on every request it returns, under `CMCD_REQUEST_PROVENANCE`, an exported `unique symbol` backed by the registry: `Symbol.for('@svta/cml-cmcd/request-provenance')`. That includes requests it did not decorate: when request reporting is disabled, and when the configured `transform` returns `null` to cancel decoration. The request was still issued by a session, and its response still needs attribution. The deprecated `applyRequestReport()` wraps `createRequestReport()` and inherits the stamp.

The reporter resolves by the record's `sid`, read structurally: a `sid` that names a retained session attributes, and anything else drops — evicted or never-seen `sid`s and values not shaped like a provenance record alike. There is no opacity contract left to document: the record is constructible, and constructing one is legitimate, so a hand-built request attributes by naming its session and a split topology (one reporter decorates, another configured with the same session records) attributes at full fidelity. One base record `{ sid, cid? }` is minted and frozen per session and re-minted when `update()` changes the session's `cid`; a request created with per-call data carries a per-request record extending the base with that data encoded, and requests without per-call data share the base, so decoration stays a single property write. Player code cannot alter an issued record in place.

The symbol is exported so a player can read the record and restore it when a request crosses a boundary that drops symbol keys, and `CmcdRequestReport` types the member as optional, so the type stays constructible by consumers that build or mock request reports; every request the reporter returns carries it. A registry symbol rather than a bare `Symbol()` keeps duplicated copies of the library in one bundle interoperable, which makes the registry string stable across versions. The module-scope constant holding it is side-effect-free for bundlers (`Symbol.for` is a known-pure global) and lives in its own module, so it tree-shakes like every other package constant.

```ts
export const CMCD_REQUEST_PROVENANCE: unique symbol = Symbol.for('@svta/cml-cmcd/request-provenance')

export type CmcdRequestProvenance = {
	readonly sid: string;
	readonly cid?: string;
	readonly data?: string;
}

export type CmcdRequestReport<D = unknown> = HttpRequest & {
	customData: {
		cmcd: Cmcd;
		[CMCD_REQUEST_PROVENANCE]?: CmcdRequestProvenance;
	} & D;
	headers: Record<string, string>;
}
```

Spread and `Object.assign` copy symbol-keyed properties. `JSON.stringify` and structured clone drop them, so a request that crosses such a boundary is dropped unless the player restores the record first — or constructs one naming the session.

### Attribution resolution

`recordResponseReceived()` resolves a session by the provenance record alone: the record's `sid` names one of this reporter's retained sessions, or the event is dropped. There is no other key — a record lost to a serialization boundary (and not restored) and a record naming an evicted or never-seen `sid` name no session this reporter owns, and attributing them anywhere else would relabel them. The record is honored wherever its `sid` resolves, so requests decorated by another reporter configured with the same session, and hand-built records, attribute. A per-call `data.sid` is report input only, never an attribution key, and the resolved session stamps its own `sid` regardless.

Dropping means the method returns without emitting. No sequence number is consumed and no gate is touched.

An attributed event is a normal event of its session. It merges that session's frozen data snapshot with the record's request-time `cid`, the per-call data decoded from the record's snapshot, the derived response keys, and per-call data. It is stamped with that session's `sid`, consumes that session's next per-target `sn`, can carry that session's `msd` if the target's gate is still open, and is suppressed by that session's 410 disposal state.

### The per-call snapshot

The record's `data` member is the per-call data the request was created with, encoded with the package's own codec and captured at the top of `createRequestReport()`, before the `enabledKeys` filter or a `transform` can lose it — which is what lets it ride requests the reporter never decorates (request reporting disabled, cancelled transforms). Per-call data is the one input the session cannot reproduce at response time: it never enters the persistent store, and it is what distinguishes the object the response is about (`ot`, `br`, `d`, buffer state at request time) from whatever the player requested later. Session-scoped keys need no snapshot, because the retained session's frozen store supplies them, and the record's `cid` covers the one session key whose request-time value changes a report's meaning. The snapshot is deliberately untransformed: a request `transform` shapes the request-mode wire report, and an event target's own `transform` and `enabledKeys` shape what the event reports, so the event pipeline is fed the caller's inputs rather than another target's edits. Reporter-stamped fields (`sn`, `sid`, `msd`) are never in it.

`recordResponseReceived()` rebuilds the request-time keys by decoding the snapshot, with tokens revived as `SfToken`, which is lossless by construction: the reporter re-reads only what it wrote. It never re-ingests the player-facing `customData.cmcd` object, which players own, may mutate, and which loses `SfItem`/`SfToken` prototypes across the JSON bridge — shape-based revival of that object could not distinguish a revived token (`{ description }`) from anything else, so token values reached the RFC 8941 serializer as plain objects, threw at send time, and poisoned batched targets. The public object remains the request-identification view players read; the reporter never reads it at all. A snapshot that does not parse (a value the reporter did not write) contributes nothing, and per-call data that cannot encode contributes no snapshot rather than failing `createRequestReport()`: either way the event reports its derived keys over the session's data alone.

Event queues hold the same currency. A report is encoded when it is queued, so a value that cannot serialize throws inside the recording call that produced it, attributable to its caller; previously the failure surfaced in the asynchronous batch send, where the retry path swallowed it and re-queued the un-encodable report forever. Queued lines are also immune to later mutation of caller-held values, so the per-target deep copy of report data runs only where a `transform` is configured.

### The transition sequence

`update({ sid })` with a new value runs five steps, in order:

1. Detach the ended session's data graph. The copy is the same one the transform path uses, complete for the CMCD value space (arrays, `SfItem`s and their `params`), so no caller-held reference can change the archived snapshot afterward.
2. Create the new session: fresh counters, gates, queues, and dedup baseline. Its data store starts as a shallow copy of the detached graph, so persistent keys (`cid`, `br`, custom keys) survive the change as they always have.
3. Drain. A processing pass sends every archived session's queued reports, including partial batches the ended session could never fill again.
4. Evict, oldest first, until the number of ended sessions is within `sessionRetention`. An evicted session's remaining state dies with it: a batch in flight during eviction that later fails re-queues into the evicted session and is never sent.
5. Re-arm interval timers for targets that were disposed in the ended session, when the reporter is started. The new session's targets are fresh, and CTA-5004-B scopes 410 suppression to the session that received it.

Draining before evicting is load-bearing. Without step 3, `sessionRetention: 0` destroys the ended session's partial batches synchronously inside `update()`.

### Wire consequences

An event-mode POST body can interleave reports from different sessions, since archived sessions drain alongside current traffic, oldest session first. The spec has no delivery-deadline language, and `sn` orders the stream within each session. This is the same tolerance the 429/5xx re-queue path already relies on.

Request-mode reports are always current-session. Nothing about decoration changes.

### Performance and bundle impact

- Per returned request: one symbol-keyed property write. A request created with per-call data also serializes that data once for the snapshot, in every mode and on every path (decorated, cancelled, reporting disabled); a request without per-call data shares the session's frozen base record and pays nothing.
- Per response: one map lookup to resolve the `sid`, plus one structured-field decode of the snapshot. Snapshot decoding puts the structured-field parser in the reporter's import graph.
- Per session change: one bounded copy of the data store and a drain pass. Session changes are rare next to reports. A `cid` change re-mints the session's two-member base record.
- Memory: the current session plus up to `sessionRetention` ended ones, each holding its data store and unsent queues.
- One module-scope constant for the registry symbol, side-effect-free for bundlers and exported from its own module, so it tree-shakes like every other constant. The public surface is the config key, the `CMCD_REQUEST_PROVENANCE` symbol, the `CmcdRequestProvenance` type, and the typed member on `CmcdRequestReport`. No token is minted: the record's members are values the session already owns.

### Testing

Regression coverage lands with the implementation, in `CmcdReporter.test.ts`:

- The review repro: a stale response emits `cid="c1", sid="s1"` with s1's next `sn`, built from s1's snapshot.
- A transform-cancelled request attributes via the record and carries its per-call data to the event; the same holds when request reporting is disabled entirely.
- `s1 → s2 → s1`: reuse replaces the retained namesake, the stale first-s1 response relabels onto the replacement with the replacement's counters, and the reused `sid` sits at the newest retention position, so it is older sessions that age out ahead of it.
- A request decorated by another reporter attributes when the recording reporter was configured with the same `sid`, and drops when the `sid` was never seen.
- The serialization bridge: a JSON-round-tripped request with the record restored via `CMCD_REQUEST_PROVENANCE` attributes exactly — including when the restored value is itself a JSON-revived copy of the record — and without restoration it drops.
- A hand-built `{ sid }` record naming a live session attributes; a record naming a never-seen `sid`, an altered record, a value not shaped like a record, and a request with no record all drop.
- The stamped record is frozen, names its session's `sid` and `cid`, and a new session mints a new record.
- The per-call snapshot: it holds the caller's inputs and never reporter-stamped fields, requests without per-call data share one frozen base record, and per-call data that cannot encode contributes no snapshot while the response still attributes.
- Request-time `cid`: a response recorded after `update({ cid })` reports the `cid` its request was issued under, while requests issued after the change carry the new one.
- The event pipeline receives untransformed per-call data: a request `transform`'s edits reach the request wire but not the `RESPONSE_RECEIVED` report.
- Token fidelity across the bridge: standard (`ot`, `sf`) and custom-key `SfToken` values ride the snapshot through a JSON round trip and reach the wire as bare tokens, never quoted strings, with nothing left stuck in the queue.
- Encode-at-enqueue: a report whose value cannot serialize throws from the recording call, and the target's queue keeps working afterward.
- Drain before eviction: a partial batch queued under s1 is sent when `update({ sid: 's2' })` runs at `sessionRetention: 0`.
- Frozen snapshot: mutating a previously passed `bl` array after the transition does not change an archived session's late report.
- Normalization table: `'1'`, `true`, and `Symbol()` fall back to `2` without throwing, `-1`, `NaN`, and `undefined` fall back to `2`, `0` is accepted and retains nothing, `2.5` floors to `2`, `Infinity` never evicts.
- A per-call `data.sid` is never an attribution key: it neither overrides a resolved record nor rescues a request without one.

## Drawbacks

- **Memory scales with retention.** Each retained session keeps its data store and any unsent queues. `Infinity` makes that unbounded, and the TSDoc says so.
- **Provenance does not survive serialization on its own.** Symbol-keyed properties are dropped by `JSON.stringify` and structured clone, so a request round-tripped through a worker or a JSON cache loses its record, and its response is dropped unless the player bridges the record with the exported symbol. Spread clones and `Object.assign` preserve it without help. The record itself is JSON-safe, so the bridge is a plain copy with no special casing. Not bridging is silent: the cost of a missed bridge rose from degraded reports (v11) to no reports, which is what makes a future drop signal worth having.
- **Snapshot memory rides in-flight requests.** A request created with per-call data holds those inputs twice — inside the player-facing `cmcd` object and as the record's encoded string — for as long as the player retains the request. Both are small and share the request's lifetime.
- **`sid` uniqueness is unenforceable.** The design bets on CTA-5004-B's expectation that a `sid` names one playback session. A caller that reuses a `sid` gets the documented degradation: the retained namesake is replaced, and its late responses relabel onto the replacement, consuming the replacement's sequence numbers, `msd` gate, and 410 scope. The damage is confined to the reused `sid`; every unique-`sid` flow is unaffected. Under the token design this case attributed exactly, at the price of the token subsystem.
- **The event's request layer is the caller's inputs, not the wire bytes.** A request `transform`'s edits reach the request-mode wire but not the `RESPONSE_RECEIVED` report, so an event report can no longer be joined byte-for-byte against what the request target sent. The trade is deliberate: event targets shape their own reports from clean inputs.
- **Harder to observe than a string field.** The record never appears in logs or JSON dumps, and inspecting it takes the imported symbol or `Object.getOwnPropertySymbols` in a debugger, though the value found there is now a readable `{ sid, cid, data }` rather than an opaque token.
- **Dropped events are silent.** A response outliving the retention window, carrying no record, or carrying a record naming a never-seen `sid` disappears without a signal. That follows the reporter's silent-tolerance convention, and a drop counter or debug hook is deliberately left to Future possibilities.
- **Every response needs a record.** `recordResponseReceived()` only attributes requests carrying one. Requests from `createRequestReport()` always do; a hand-built request must construct one naming its session.
- **Behavioral change from released versions.** Stale responses were previously relabeled with the current `sid`. Any collector pipeline that depended on that (deliberately or not) sees attribution move to the issuing session, or lose the event at `sessionRetention: 0`.
- **Interleaved batches.** A collector may receive one POST body mixing two sessions' reports. Spec-tolerated, but worth stating.

## Rationale and alternatives

- **Relabel to the current session (status quo)**: violates the spec's session scoping and is the bug class this design removes.
- **Epoch guards without retention** (the first shape of #416): a counter can detect that a response is stale and protect the current session from it, but it cannot attribute the response to anything, so every late arrival is dropped. Retention subsumes the guard and keeps the data.
- **Drop everything stale (default `sessionRetention: 0`)**: safest memory profile, but it throws away reports the issuing session already paid for, and the common case (one content transition with a few requests in flight) is exactly what a small window handles. Review discussion settled on a two-session window.
- **`sid` strings as the only session key**: the shipped shape of #416, and the follow-up review broke it twice. A cancelled transform stores no `sid`, and a reused `sid` names two different sessions. Both need provenance that exists independent of wire keys, which is the record: its `sid` is session state stamped on every returned request, not a wire key subject to filters and transforms.
- **The `sid` as the provenance value (a symbol-keyed copy of it)**: rejected in v8 while the `sid` fallback machinery existed, adopted in v13. The v8 objections were three. The cancelled-transform hole is closed structurally: the record rides every returned request and its `sid` never depends on decoration. The generation objection (two uses of one `sid` are two sessions a `sid`-keyed map cannot hold at once) is no longer defended against but priced: `sid` uniqueness is the caller's contract per CTA-5004-B, and violating it degrades to a documented replacement instead of being made impossible by a minted token. What remains true is that only a reporter-minted value is unique by construction; v13 concludes that guarantee is not worth the token subsystem when its sole remaining job is protecting callers from violating a spec-backed expectation, and when the token also priced out hand-built requests and split topologies, which the constructible record serves.
- **A `WeakMap` from request object to session**: zero public surface, but identity-keyed, so any clone breaks the link, including the spread clones players make routinely. The symbol key survives spread clones and `Object.assign`. Neither survives structured clone; only the string-named field below does, and it loses on other grounds.
- **An opaque request id resolved against a reporter-private map** (raised after merge): stamp a minted id on each returned request and keep the provenance state (`sid`, `cid`, the per-call snapshot) in an internal map keyed by that id, so no state rides the request and no returned value is trusted. Rejected on lifecycle. Request-scoped state has no correct lifetime outside the request object: requests are aborted, time out, or never reach `recordResponseReceived()`, so the map must grow without bound, age entries out nondeterministically, or add a release call whose omission is a leak. State on the request shares the request's lifetime and is collected with it. The id also travels exactly the channels the record travels (the same symbol key, surviving spread, dying at JSON boundaries), so transport does not improve, while self-description, cross-copy interop through the registry symbol, and the constructible topologies (hand-built requests, split decorate/record reporters) are all lost, restoring the v12 drops that v13 dissolved. The hot path inverts too: every request would mint an id and a map entry, where a request without per-call data shares one frozen base record today. And the trust removed is intra-trust-domain: the record is frozen, the snapshot is reporter-written bytes that parse or contribute nothing, and a caller can already direct attribution through the public API. A real trust boundary (untrusted plugins) or a runtime with guaranteed request-completion hooks would change the calculus. Web players have neither.
- **A string-named field (`customData.cmcdSession`, this proposal's v1 through v3)**: the only variant that survives JSON and structured clone, and it is straightforwardly typed on `CmcdRequestReport`. Rejected because it consumes a name in the player's `customData` namespace, adds a public type member whose whole contract is "do not touch", and the topologies it saves (requests serialized between decoration and response) are ones no known player runs. The symbol makes opacity structural instead of contractual.
- **Storing the token inside `customData.cmcd`**: the wrong lifecycle even symbol-keyed. The stored `cmcd` is `prepareCmcdData()` output, rebuilt when decoration succeeds, so the token would be stamped twice, and `recordResponseReceived()` spreads the stored `cmcd` into the event report, where spread copies symbol keys, so the token would ride every `rr` report item through transforms as inert baggage. `customData` itself is built once and never merged into report data.
- **A bare numeric generation counter**: collides across reporter instances. Reporter B's generation 2 is not reporter A's generation 2, and a collision mis-attributes instead of falling back. Tokens must be unguessable and classified by exact identity.
- **A random per-session id with no issued-token tracking**: under the v1 through v11 `sid` fallback this could not distinguish "my evicted session" (drop) from "another reporter's session" (fall back), so classification needed eviction tombstones, and the v5 through v8 instance-prefix scheme that avoided them was forgeable via its sequential generation suffix. v12's uniform drop dissolves the distinction, and this shape — minted `uuid()` tokens classified only against retained sessions — became the design.
- **A `sid` fallback chain for unresolvable provenance** (v1 through v11 of this proposal): tokenless and foreign requests resolved by the `sid` in the request's stored data, then a per-call `data.sid`, then the current session, with the newest retained session winning a reused name. Rejected on reexamination: it kept two lifecycle-managed structures (a newest-per-`sid` index, and eviction tombstones whose only job was telling an evicted token from a foreign one) plus the reused-`sid` ambiguity rules, in service of split topologies no known player runs, and its best case was `sid`-granularity attribution that can still mis-scope a report — a reused `sid` resolves to the wrong generation on any reporter that did not issue the request. CTA-5004-B scopes session semantics to the issuing session; a report the reporter cannot place is better absent than mislabeled, and the drop is inspectable where the fallback's mislabeling was not.

## Prior art

- **hls.js** (`CMCDController`) and **dash.js** (`CmcdModel`) keep one live session's identity in instance fields and stamp the current `sid` at request time. Neither retains prior-session state, so both relabel late responses. That is the ecosystem default this proposal moves away from.
- **Shaka Player** (`CmcdManager`) is the same shape: current-session fields, no retention.
- **The report-transforms RFC** (`rfc/cmcd-reporter-middleware.md`) established the two mechanisms this design reuses: reporter-written state on `customData`, and the bounded copier that is complete for the CMCD value space.

## Unresolved questions

None. Earlier drafts left the default window and the foreign-token fallback open; both were settled in-document (see Revision history, v3 and v7), and the fallback was later removed entirely (v12).

## Future possibilities

- Child reporters ([PR #398](https://github.com/streaming-video-technology-alliance/common-media-library/pull/398)) share session state by construction: children read the root's current session object, and a `sid` change swaps one object instead of resetting scattered fields.
- Automatic starvation counters (`plans/cmcd-session-counters/design.md`) are session-scoped by definition and would live on the session object, with per-target `bsd` cursors following the same filter-aware gate rules as `msd`.
- Time-based eviction, if count-based retention proves wrong for some traffic shape.
- A drop signal (counter or debug callback) if silent drops turn out to hide real integration bugs.

## Revision history

- **2026-08-12 (v1)**: initial draft. Converts the retained-session design from `plans/cmcd-session-fixes/session-state.md` into a public proposal, corrected per the #416 follow-up review: provenance tokens on decorated requests (replacing `sid`-string-only attribution), drain before eviction, detached archived snapshots, and type-checked normalization for `sessionRetention`.
- **2026-08-12 (v2)**: `sessionRetention` counts ended sessions, excluding the active one, so `0` disables retention (v1 counted every session including the current one, minimum `1`). The default is re-expressed as `2`, the same effective window as v1's `3`. The normalization wording now separates type checking (non-numbers fall back, never convert) from numeric normalization (flooring, range check), which v1 conflated as "validation, never coercion". Both from PR #417 review.
- **2026-08-12 (v3)**: the default window of `2` ended sessions is part of the proposal rather than an open question, and is removed from Unresolved questions.
- **2026-08-12 (v4)**: the provenance token moves from a string-named public field (`customData.cmcdSession`) to a library-owned registry symbol on `customData`, so it cannot collide with player keys, never appears in string-keyed enumeration or JSON output, and leaves `CmcdRequestReport` unchanged. The cost is stated in Drawbacks: symbol keys do not survive `JSON.stringify` or structured clone, so serialized-request topologies fall back to `sid` attribution, and the WeakMap rationale is rewritten to stop claiming serialization survival as the deciding argument. The field-name question dissolves; a symbol export for serialization bridges moves to Future possibilities.
- **2026-08-12 (v5)**: the provenance symbol is exported as `CMCD_SESSION` (a `unique symbol` backed by the registry), and `CmcdRequestReport` types the member, so a player whose requests cross a serialization boundary can carry the token and restore it. The value contract is stated (restore verbatim, never fabricate; unknown values classify as foreign and fall back), and a misuse drawback is recorded. Replaces v4's not-exported stance and retires the Future-possibilities bridge item.
- **2026-08-12 (v6)**: the export is renamed `CMCD_REQUEST_PROVENANCE`, backed by `Symbol.for('@svta/cml-cmcd/request-provenance')`. v5's `CMCD_SESSION` collides with the package's existing `'CMCD-Session'` header-field constant. No semantic change.
- **2026-08-12 (v7)**: the foreign-token fallback (rule 3) is part of the proposal rather than an open question. Unresolved questions is now empty, and the drop-foreign-tokens alternative is recorded under Rationale and alternatives.
- **2026-08-12 (v8)**: post-acceptance documentation amendment from implementation review discussion: records the rejected `sid`-as-provenance-value alternative (a symbol-keyed copy of the `sid` instead of a minted token) under Rationale and alternatives. No semantic change.
- **2026-08-12 (v9)**: implementation-review corrections from #416 round 3. The provenance member on `CmcdRequestReport` is optional, keeping the public type constructible by consumers; the reporter still stamps every request it returns. Token classification uses exact issued tokens (retained sessions plus eviction tombstones) instead of the v5 through v8 instance-prefix scheme, which was forgeable via its sequential generation suffix and misclassified altered tokens as own; tokens are opaque `uuid()` values. The performance section reflects two-lookup classification and a constant-time `sid` index on the fallback path.
- **2026-08-12 (v10)**: post-acceptance amendment: the provenance value becomes a frozen record, `CmcdRequestProvenance` (`{ readonly token: string }`), minted once per session, instead of the bare token string. The record shape makes future provenance members (for example, an encoded report snapshot for serialization-boundary fidelity) additive for players that already bridge the value, where flipping a released string to an object would break every bridge; the pre-release window is the last point this change is free. Classification semantics are unchanged: the token inside the record is read structurally, so a JSON-revived copy of the record attributes exactly, and a malformed value (no `token` string to read) classifies as foreign under rule 3.
- **2026-08-12 (v11)**: post-acceptance amendment, the second half of the v10 direction. Decorated requests extend the record with `cmcd`, the report's wire bytes, and `recordResponseReceived()` rebuilds request-time data by decoding them instead of re-ingesting the player-facing `customData.cmcd` object, whose `sid` remains the rule 3 fallback. Shape-based revival of the public object is removed: it could not distinguish a JSON-revived `SfToken` (a `{ description }` plain object) from anything else, so token values reached the RFC 8941 serializer un-revived, threw at send time, and poisoned batched targets, and a revived custom-key token that did survive would have degraded to a quoted string; decoding reporter-written bytes is lossless by construction. Event queues now hold encoded report lines (encode-at-enqueue), so a value that cannot serialize throws from the recording call instead of silently blocking the queue, and the per-target deep copy of report data runs only where a `transform` is configured. A request whose record is lost to serialization attributes by `sid` but reports derived keys over session data alone, recorded under Drawbacks.
- **2026-08-13 (v12)**: post-acceptance amendment: attribution is by the provenance record alone. The `sid` fallback chain for tokenless and foreign requests is removed, along with the machinery that existed only to serve it — the newest-per-`sid` session index, the eviction tombstones whose only job was telling an evicted token from a foreign one, and the reused-`sid` precedence rules. A response whose record does not name a retained session is dropped: lost-and-unbridged records, altered and fabricated values, other reporter instances' requests, hand-built requests, and evicted sessions alike. A per-call `data.sid` is never an attribution key, and the reporter no longer reads the player-facing `customData.cmcd` object at all. The rejected fallback is recorded under Rationale and alternatives; the raised cost of a missed bridge (no reports instead of degraded ones) is recorded under Drawbacks.
- **2026-08-13 (v13)**: post-acceptance amendment: session identity moves to the `sid` itself, and the minted token goes away. `CmcdRequestProvenance` becomes `{ sid, cid?, data? }`, and sessions are keyed by `sid`, whose uniqueness per playback session is CTA-5004-B's expectation and now the caller's contract: reuse replaces the retained namesake at the newest retention position, and the replaced session's late responses relabel onto the replacement (recorded under Drawbacks). The record becomes constructible — hand-built requests and split decorate/record topologies attribute wherever the `sid` resolves, dissolving two v12 drops and the opacity contract with them. The wire-bytes snapshot becomes the per-call data snapshot, captured before the key filter and transform on every returned request: this closes the gap where disabled request reporting and cancelled transforms lost per-call inputs entirely, feeds event targets untransformed inputs instead of request-transform output, and drops reporter-stamped fields from the snapshot. The record gains `cid`, the content id at issue time, re-minted on `update({ cid })`, so a `RESPONSE_RECEIVED` event landing after a mid-session content change reports the content its request was about. Per-call data that cannot encode contributes no snapshot rather than failing `createRequestReport()`.

- **2026-08-14 (v14)**: post-acceptance documentation amendment: records the rejected request-id alternative (a minted id stamped on returned requests, resolved against a reporter-private map holding the session and per-call state) under Rationale and alternatives. No semantic change.

## Final Decision

**Decision:** Accepted as proposed in v7.

**Rationale:** Review on [PR #417](https://github.com/streaming-video-technology-alliance/common-media-library/pull/417) shaped the proposal rather than contested it. `sessionRetention` counts ended sessions, with `0` disabling retention and a default window of two. Provenance moved from a string-named `customData` field to the exported `CMCD_REQUEST_PROVENANCE` registry symbol, with the serialization bridge as the escape hatch for boundaries that drop symbol keys. The foreign-token `sid` fallback (rule 3) was accepted as proposed and later removed by the v12 post-acceptance amendment, and the v13 amendment retired the minted token itself in favor of `sid`-keyed identity (see Revision history). Every question raised during drafting was settled in-document, so the RFC was accepted with no unresolved questions.

**Date:** 2026-08-12
