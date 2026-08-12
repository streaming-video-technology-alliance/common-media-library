---
status: implemented
implemented-in: @svta/cml-cmcd@2.6.0
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
- Requests returned by `createRequestReport()` carry an opaque session token on `customData`, keyed by an exported symbol, `CMCD_REQUEST_PROVENANCE`, rather than a string name. It collides with nothing and never appears in string-keyed enumeration or JSON output, and a player whose requests cross a serialization boundary can carry the token explicitly and restore it.
- `recordResponseReceived()` resolves the session a response belongs to and either attributes the event to that session or drops the event. It never relabels a report with the current `sid`.

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

Per-session state objects fix all of these with one structure instead of six guards. The structure itself is internal, but it needs one config option (how many ended sessions to keep), one token on decorated requests (which session issued this), and defined resolution semantics on `recordResponseReceived()`. Those are public API, and repo process requires public API to go through an RFC. This document is that proposal. The `msd` validation and 410-scoping corrections in #416 are spec-compliance bug fixes and are not part of it.

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

### The provenance token

Provenance rides the decorated request itself, on `customData`, keyed by the exported symbol `CMCD_REQUEST_PROVENANCE` rather than a string name. A symbol key cannot collide with a player's own `customData` keys, never shows up in `Object.keys`, `for...in`, or `JSON.stringify` output, and cannot be touched by accident: reaching it takes a deliberate import.

The token's value stays opaque. Read it to carry it and restore it verbatim; never fabricate or alter one. A value the reporter did not write names no session it owns, so misuse falls back to `sid` attribution instead of mis-attributing.

The token survives the ways players ordinarily copy requests. Where symbol keys die (JSON, structured clone), the exported symbol is the bridge:

```ts
import { CMCD_REQUEST_PROVENANCE } from '@svta/cml-cmcd'

const request = reporter.createRequestReport({ url: 'https://cdn.example.com/v/seg-42.m4s' })

// Spread and Object.assign copy symbol-keyed properties, so ordinary
// clones keep the token.
const clone = { ...request, headers: { ...request.headers } }

// JSON and structured clone drop symbol keys, so carry the token
// explicitly across such a boundary and restore it afterward.
const payload = {
	request: JSON.parse(JSON.stringify(request)),
	token: request.customData[CMCD_REQUEST_PROVENANCE],
}
payload.request.customData[CMCD_REQUEST_PROVENANCE] = payload.token

// A request restored this way attributes exactly. One that lost its
// token falls back to sid attribution (resolution rule 3).
```

The token never reaches the wire in either transmission mode: every encode path starts from string-keyed enumeration, so a symbol-keyed member is invisible to it.

## Reference-level explanation

### The session object

Everything the spec scopes to a session moves into one internal object, created fresh on every `sid` change:

```ts
type CmcdSession<C> = {
	sid: string
	token: string                  // opaque provenance token, unique per session per reporter
	data: Cmcd                     // persistent data store for this session
	msd: number                    // NaN until a valid update({ msd })
	lastEmitted: Partial<Pick<Cmcd, StateField>>
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTarget>
	requestTarget: CmcdTarget
}
```

Per-target state (`sn`, the `msd` gate, queues, 410 disposal) lives inside the session, so a late report consumes its own session's counters and a delayed 410 disposes its own session's target. Timers live on the reporter and tick across transitions.

Retained sessions are keyed by token, insertion-ordered oldest first. A reused `sid` is a new session with a new token, per CTA-5004-B's definition of a session change, so `s1 → s2 → s1` retains two distinct s1 sessions, and retention counts ended sessions, never distinct `sid` strings.

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

### The provenance token

`createRequestReport()` stamps the token on every request it returns, under `CMCD_REQUEST_PROVENANCE`, an exported `unique symbol` backed by the registry: `Symbol.for('@svta/cml-cmcd/request-provenance')`. That includes requests it did not decorate: when request reporting is disabled, and when the configured `transform` returns `null` to cancel decoration. The request was still issued by a session, and its response still needs attribution. The deprecated `applyRequestReport()` wraps `createRequestReport()` and inherits the stamp.

The token value is unique per session and per reporter instance, so the issuing reporter can tell three cases apart: its own retained session, its own evicted session, and a token written by some other reporter. The value's format is an implementation detail and the contract is opacity: a restored token must be the one the reporter wrote, and a fabricated or altered value classifies as foreign, so misuse degrades to rule 3 rather than mis-attributing.

The symbol is exported so a player can read the token and restore it when a request crosses a boundary that drops symbol keys, and `CmcdRequestReport` types the member, so the value is `string` wherever the request's type is known. A registry symbol rather than a bare `Symbol()` keeps duplicated copies of the library in one bundle interoperable, which makes the registry string stable across versions. The module-scope constant holding it is side-effect-free for bundlers (`Symbol.for` is a known-pure global) and lives in its own module, so it tree-shakes like every other package constant.

```ts
export const CMCD_REQUEST_PROVENANCE: unique symbol = Symbol.for('@svta/cml-cmcd/request-provenance')

export type CmcdRequestReport<D = unknown> = HttpRequest & {
	customData: {
		cmcd: Cmcd;
		[CMCD_REQUEST_PROVENANCE]: string;
	} & D;
	headers: Record<string, string>;
}
```

Spread and `Object.assign` copy symbol-keyed properties. `JSON.stringify` and structured clone drop them, so a request that crosses such a boundary resolves by rule 3 below unless the player restores the token first.

### Attribution resolution

`recordResponseReceived()` resolves a session in this order:

1. The token names one of this reporter's retained sessions: attribute to that session. A conflicting per-call `data.sid` is ignored, because reporter-written provenance beats caller-supplied keys.
2. The token names a session this reporter created but no longer retains: drop the event. Falling back to `sid` lookup here would reintroduce relabeling. After `s1 → s2 → s1`, the evicted first s1 would resolve by name to the live second s1.
3. The token is absent or belongs to another reporter instance: fall back to the stored `customData.cmcd.sid`, then to a per-call `data.sid`, then to the current session. A `sid` that names no retained session drops the event. When a `sid` string matches more than one retained session, the newest wins.

Dropping means the method returns without emitting. No sequence number is consumed and no gate is touched.

An attributed event is a normal event of its session. It merges that session's frozen data snapshot with the stored request data, the derived response keys, and per-call data. It is stamped with that session's `sid`, consumes that session's next per-target `sn`, can carry that session's `msd` if the target's gate is still open, and is suppressed by that session's 410 disposal state.

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

- Per decorated request: one symbol-keyed property write on `customData`.
- Per response: one map lookup, plus at most one string comparison to classify a foreign token.
- Per session change: one bounded copy of the data store and a drain pass. Session changes are rare next to reports.
- Memory: the current session plus up to `sessionRetention` ended ones, each holding its data store and unsent queues.
- One module-scope constant for the registry symbol, side-effect-free for bundlers and exported from its own module, so it tree-shakes like every other constant. The public surface is the config key, the `CMCD_REQUEST_PROVENANCE` symbol, and the typed member on `CmcdRequestReport`.

### Testing

Regression coverage lands with the implementation, in `CmcdReporter.test.ts`:

- The review repro: a stale response emits `cid="c1", sid="s1"` with s1's next `sn`, built from s1's snapshot.
- A transform-cancelled request attributes via the token, and drops once its session is evicted.
- `s1 → s2 → s1`: a first-s1 response attributes to the first s1 while retained, drops after eviction, and never resolves to the second s1.
- A token from another reporter instance falls back to `sid` attribution.
- The serialization bridge: a JSON-round-tripped request with the token restored via `CMCD_REQUEST_PROVENANCE` attributes exactly, and without restoration it falls back to `sid` attribution.
- A fabricated token value classifies as foreign and falls back rather than attributing.
- Drain before eviction: a partial batch queued under s1 is sent when `update({ sid: 's2' })` runs at `sessionRetention: 0`.
- Frozen snapshot: mutating a previously passed `bl` array after the transition does not change an archived session's late report.
- Normalization table: `'1'`, `true`, and `Symbol()` fall back to `2` without throwing, `-1`, `NaN`, and `undefined` fall back to `2`, `0` is accepted and retains nothing, `2.5` floors to `2`, `Infinity` never evicts.
- Precedence: a per-call `data.sid` is ignored when the token resolves, and attributes when only it is available.

## Drawbacks

- **Memory scales with retention.** Each retained session keeps its data store and any unsent queues. `Infinity` makes that unbounded, and the TSDoc says so.
- **Provenance does not survive serialization on its own.** Symbol-keyed properties are dropped by `JSON.stringify` and structured clone, so a request round-tripped through a worker or a JSON cache falls back to `sid` attribution unless the player bridges the token with the exported symbol. Spread clones and `Object.assign` preserve it without help.
- **Harder to observe.** The token never appears in logs or JSON dumps, and inspecting it takes the imported symbol or `Object.getOwnPropertySymbols` in a debugger. The invisibility that prevents accidental coupling also hides it from quick diagnostics.
- **The export invites deliberate misuse.** A public symbol means a player can write under it, not only read. The contract (restore verbatim, never fabricate) is documentation, though the failure is contained: an unknown value classifies as foreign and falls back, so a forged token cannot relabel another session's report.
- **Dropped events are silent.** A response outliving the retention window disappears without a signal. That follows the reporter's silent-tolerance convention, and a drop counter or debug hook is deliberately left to Future possibilities.
- **Behavioral change from released versions.** Stale responses were previously relabeled with the current `sid`. Any collector pipeline that depended on that (deliberately or not) sees attribution move to the issuing session, or lose the event at `sessionRetention: 0`.
- **Interleaved batches.** A collector may receive one POST body mixing two sessions' reports. Spec-tolerated, but worth stating.
- **Cross-instance attribution is coarser.** A response recorded on a reporter that did not decorate the request resolves at `sid` granularity, with the reused-`sid` ambiguity that implies. Only the issuing reporter can resolve a generation exactly.

## Rationale and alternatives

- **Relabel to the current session (status quo)**: violates the spec's session scoping and is the bug class this design removes.
- **Epoch guards without retention** (the first shape of #416): a counter can detect that a response is stale and protect the current session from it, but it cannot attribute the response to anything, so every late arrival is dropped. Retention subsumes the guard and keeps the data.
- **Drop everything stale (default `sessionRetention: 0`)**: safest memory profile, but it throws away reports the issuing session already paid for, and the common case (one content transition with a few requests in flight) is exactly what a small window handles. Review discussion settled on a two-session window.
- **`sid` strings as the only session key**: the shipped shape of #416, and the follow-up review broke it twice. A cancelled transform stores no `sid`, and a reused `sid` names two different sessions. Both need provenance that exists independent of wire keys, which is the token.
- **A `WeakMap` from request object to session**: zero public surface, but identity-keyed, so any clone breaks the link, including the spread clones players make routinely. The symbol key survives spread clones and `Object.assign`. Neither survives structured clone; only the string-named field below does, and it loses on other grounds.
- **A string-named field (`customData.cmcdSession`, this proposal's v1 through v3)**: the only variant that survives JSON and structured clone, and it is straightforwardly typed on `CmcdRequestReport`. Rejected because it consumes a name in the player's `customData` namespace, adds a public type member whose whole contract is "do not touch", and the topologies it saves (requests serialized between decoration and response) are ones no known player runs. The symbol makes opacity structural instead of contractual.
- **Storing the token inside `customData.cmcd`**: the wrong lifecycle even symbol-keyed. The stored `cmcd` is `prepareCmcdData()` output, rebuilt when decoration succeeds, so the token would be stamped twice, and `recordResponseReceived()` spreads the stored `cmcd` into the event report, where spread copies symbol keys, so the token would ride every `rr` report item through transforms as inert baggage. `customData` itself is built once and never merged into report data.
- **A bare numeric generation counter**: collides across reporter instances. Reporter B's generation 2 is not reporter A's generation 2, and a collision mis-attributes instead of falling back. The instance-scoped token makes foreign tokens recognizable.
- **A random per-session id with no instance scope**: cannot distinguish "my evicted session" (drop, rule 2) from "another reporter's session" (fall back, rule 3). One of the two cases would get the wrong behavior.
- **Dropping foreign tokens instead of falling back**: simpler and stricter, but it would silently discard responses in split topologies where one reporter records responses for requests another reporter decorated. The fallback's worst case is `sid`-level attribution, which is today's shipped behavior, so rule 3 keeps it.

## Prior art

- **hls.js** (`CMCDController`) and **dash.js** (`CmcdModel`) keep one live session's identity in instance fields and stamp the current `sid` at request time. Neither retains prior-session state, so both relabel late responses. That is the ecosystem default this proposal moves away from.
- **Shaka Player** (`CmcdManager`) is the same shape: current-session fields, no retention.
- **The report-transforms RFC** (`rfc/cmcd-reporter-middleware.md`) established the two mechanisms this design reuses: reporter-written state on `customData`, and the bounded copier that is complete for the CMCD value space.

## Unresolved questions

None. Earlier drafts left the default window and the foreign-token fallback open; both are part of the proposal (see Revision history, v3 and v7).

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

## Final Decision

**Decision:** Accepted as proposed in v7.

**Rationale:** Review on [PR #417](https://github.com/streaming-video-technology-alliance/common-media-library/pull/417) shaped the proposal rather than contested it. `sessionRetention` counts ended sessions, with `0` disabling retention and a default window of two. Provenance moved from a string-named `customData` field to the exported `CMCD_REQUEST_PROVENANCE` registry symbol, with the serialization bridge as the escape hatch for boundaries that drop symbol keys. The foreign-token `sid` fallback (rule 3) is the shipped behavior. Every question raised during drafting was settled in-document (see Revision history), so the RFC was accepted with no unresolved questions.

**Date:** 2026-08-12
