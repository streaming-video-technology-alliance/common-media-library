---
status: draft
---

# RFC: Session retention in `CmcdReporter`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-08-11 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No (one behavioral change, see Drawbacks) |

## Summary

`CmcdReporter` retains the state of past sessions in a bounded window, so a report that completes after a `sid` change is built from and accounted against the session it belongs to. Today the reporter keeps one live session and resets it in place, so anything still in flight at the change (a media request, a queued batch) is either relabeled with the new `sid` or lost.

Three pieces of this are public:

- `sessionRetention`, a new option on `CmcdReporterConfig`, bounds how many sessions the reporter keeps, including the current one. Default `3`.
- Requests returned by `createRequestReport()` carry an opaque session token in `customData.cmcdSession`, next to the existing `customData.cmcd`.
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
// provenance in customData.cmcdSession.
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

Per-session state objects fix all of these with one structure instead of six guards. The structure itself is internal, but it needs one config option (how many sessions to keep), one field on decorated requests (which session issued this), and defined resolution semantics on `recordResponseReceived()`. Those are public API, and repo process requires public API to go through an RFC. This document is that proposal. The `msd` validation and 410-scoping corrections in #416 are spec-compliance bug fixes and are not part of it.

## Guide-level explanation

### Late responses report under their own session

Nothing needs to be configured. A request decorated by `createRequestReport()` remembers the session it was issued in. If the response arrives after a `sid` change, the `RESPONSE_RECEIVED` event carries the issuing session's `sid`, consumes that session's next sequence number, and draws snapshot keys (`cid`, custom keys, and the rest) from that session's data as it stood at the transition. The Summary example shows the flow.

If the issuing session has already been evicted, the event is dropped. A dropped response is silent, consistent with the reporter's tolerance conventions: no exception, no console noise.

### Bounding the window

`sessionRetention` sets how many sessions the reporter keeps, counting the current one:

```ts
import { CmcdReporter } from '@svta/cml-cmcd'

// Keep only the current session. A response that completes after a sid
// change is dropped, never attributed and never relabeled.
const strict = new CmcdReporter({ sessionRetention: 1 })

// Never evict. Also retains every session's unsent queues for the life
// of the reporter, so memory grows with each session change.
const unbounded = new CmcdReporter({ sessionRetention: Infinity })
```

The default of `3` covers a run of short sessions in quick succession, for example ad pods that rotate `sid` per break.

### A session change sends what the old session still holds

Changing `sid` drains the ended session before anything is evicted. Queued event reports that never filled a batch are sent at the transition, labeled and sequenced by the session that produced them. Timers are untouched and keep ticking into the new session.

### The archived snapshot is frozen

At the transition, the ended session's data is detached from every reference the caller holds. Mutating an array passed to an earlier `update()` no longer changes what an archived session's late reports say. Within the live session, values handed to `update()` are stored by reference, unchanged from today.

### The provenance token

Provenance rides the decorated request itself, in `customData.cmcdSession`, beside the `customData.cmcd` data the reporter already writes there:

```ts
const request = reporter.createRequestReport({ url: 'https://cdn.example.com/v/seg-42.m4s' })
typeof request.customData.cmcdSession // 'string'
```

The token is opaque. Players must not parse it or assign meaning to its shape, only carry it: a player that clones or serializes requests between decoration and response must preserve `customData` for attribution to work, which the stored `cmcd` data already required. The token never reaches the wire in either transmission mode.

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

Retained sessions are keyed by token, insertion-ordered oldest first. A reused `sid` is a new session with a new token, per CTA-5004-B's definition of a session change, so `s1 → s2 → s1` retains two distinct s1 sessions, and retention counts sessions, never distinct `sid` strings.

### `sessionRetention`

```ts
/**
 * The number of sessions the reporter retains state for, including the
 * current one. Retained sessions let a response that completes after a
 * `sid` change report under the session that issued its request, with
 * that session's data snapshot and sequence numbers. `1` keeps only the
 * current session, so stale responses are dropped. `Infinity` never
 * evicts, which also retains every session's unsent report queues.
 *
 * @defaultValue 3
 */
sessionRetention?: number;
```

Normalization is validation, never coercion. Only `number` values are considered: a number is floored, and a floored value of `1` or greater is used, `Infinity` included. Every other input falls back to `3`, including numeric strings, booleans, `NaN`, `0`, negative numbers, and values like `Symbol` that would throw under arithmetic coercion.

### The provenance token

`createRequestReport()` stamps `customData.cmcdSession` on every request it returns. That includes requests it did not decorate: when request reporting is disabled, and when the configured `transform` returns `null` to cancel decoration. The request was still issued by a session, and its response still needs attribution. The deprecated `applyRequestReport()` wraps `createRequestReport()` and inherits the stamp.

The token is unique per session and per reporter instance, so the issuing reporter can tell three cases apart: its own retained session, its own evicted session, and a token written by some other reporter. The format is an implementation detail and the public contract is opacity.

`CmcdRequestReport` gains the field:

```ts
export type CmcdRequestReport<D = unknown> = HttpRequest & {
	customData: {
		cmcd: Cmcd;
		cmcdSession: string;
	} & D;
	headers: Record<string, string>;
}
```

### Attribution resolution

`recordResponseReceived()` resolves a session in this order:

1. `customData.cmcdSession` names one of this reporter's retained sessions: attribute to that session. A conflicting per-call `data.sid` is ignored, because reporter-written provenance beats caller-supplied keys.
2. `customData.cmcdSession` names a session this reporter created but no longer retains: drop the event. Falling back to `sid` lookup here would reintroduce relabeling. After `s1 → s2 → s1`, the evicted first s1 would resolve by name to the live second s1.
3. The token is absent or belongs to another reporter instance: fall back to the stored `customData.cmcd.sid`, then to a per-call `data.sid`, then to the current session. A `sid` that names no retained session drops the event. When a `sid` string matches more than one retained session, the newest wins.

Dropping means the method returns without emitting. No sequence number is consumed and no gate is touched.

An attributed event is a normal event of its session. It merges that session's frozen data snapshot with the stored request data, the derived response keys, and per-call data. It is stamped with that session's `sid`, consumes that session's next per-target `sn`, can carry that session's `msd` if the target's gate is still open, and is suppressed by that session's 410 disposal state.

### The transition sequence

`update({ sid })` with a new value runs five steps, in order:

1. Detach the ended session's data graph. The copy is the same one the transform path uses, complete for the CMCD value space (arrays, `SfItem`s and their `params`), so no caller-held reference can change the archived snapshot afterward.
2. Create the new session: fresh counters, gates, queues, and dedup baseline. Its data store starts as a shallow copy of the detached graph, so persistent keys (`cid`, `br`, custom keys) survive the change as they always have.
3. Drain. A processing pass sends every archived session's queued reports, including partial batches the ended session could never fill again.
4. Evict, oldest first, until the count is within `sessionRetention`. An evicted session's remaining state dies with it: a batch in flight during eviction that later fails re-queues into the evicted session and is never sent.
5. Re-arm interval timers for targets that were disposed in the ended session, when the reporter is started. The new session's targets are fresh, and CTA-5004-B scopes 410 suppression to the session that received it.

Draining before evicting is load-bearing. Without step 3, `sessionRetention: 1` destroys the ended session's partial batches synchronously inside `update()`.

### Wire consequences

An event-mode POST body can interleave reports from different sessions, since archived sessions drain alongside current traffic, oldest session first. The spec has no delivery-deadline language, and `sn` orders the stream within each session. This is the same tolerance the 429/5xx re-queue path already relies on.

Request-mode reports are always current-session. Nothing about decoration changes.

### Performance and bundle impact

- Per decorated request: one string stamp on `customData`.
- Per response: one map lookup, plus at most one string comparison to classify a foreign token.
- Per session change: one bounded copy of the data store and a drain pass. Session changes are rare next to reports.
- Memory: bounded by `sessionRetention` times the session state (data store plus unsent queues).
- No new module-scope code and no new runtime exports beyond the config key and the `customData` field. Tree-shaking is unaffected.

### Testing

Regression coverage lands with the implementation, in `CmcdReporter.test.ts`:

- The review repro: a stale response emits `cid="c1", sid="s1"` with s1's next `sn`, built from s1's snapshot.
- A transform-cancelled request attributes via the token, and drops once its session is evicted.
- `s1 → s2 → s1`: a first-s1 response attributes to the first s1 while retained, drops after eviction, and never resolves to the second s1.
- A token from another reporter instance falls back to `sid` attribution.
- Drain before eviction: a partial batch queued under s1 is sent when `update({ sid: 's2' })` runs at `sessionRetention: 1`.
- Frozen snapshot: mutating a previously passed `bl` array after the transition does not change an archived session's late report.
- Normalization table: `'1'`, `true`, and `Symbol()` fall back to `3` without throwing, `0`, `-1`, `NaN`, and `undefined` fall back to `3`, `2.5` floors to `2`, `Infinity` never evicts.
- Precedence: a per-call `data.sid` is ignored when the token resolves, and attributes when only it is available.

## Drawbacks

- **Memory scales with retention.** Each retained session keeps its data store and any unsent queues. `Infinity` makes that unbounded, and the TSDoc says so.
- **A second reporter-written key in the caller's `customData`.** `cmcd` set the precedent, but every reserved key narrows the player's namespace.
- **Dropped events are silent.** A response outliving the retention window disappears without a signal. That follows the reporter's silent-tolerance convention, and a drop counter or debug hook is deliberately left to Future possibilities.
- **Behavioral change from released versions.** Stale responses were previously relabeled with the current `sid`. Any collector pipeline that depended on that (deliberately or not) sees attribution move to the issuing session, or lose the event at `sessionRetention: 1`.
- **Interleaved batches.** A collector may receive one POST body mixing two sessions' reports. Spec-tolerated, but worth stating.
- **Cross-instance attribution is coarser.** A response recorded on a reporter that did not decorate the request resolves at `sid` granularity, with the reused-`sid` ambiguity that implies. Only the issuing reporter can resolve a generation exactly.

## Rationale and alternatives

- **Relabel to the current session (status quo)**: violates the spec's session scoping and is the bug class this design removes.
- **Epoch guards without retention** (the first shape of #416): a counter can detect that a response is stale and protect the current session from it, but it cannot attribute the response to anything, so every late arrival is dropped. Retention subsumes the guard and keeps the data.
- **Drop everything stale (default `sessionRetention: 1`)**: safest memory profile, but it throws away reports the issuing session already paid for, and the common case (one content transition with a few requests in flight) is exactly what a small window handles. Review discussion settled on `3`.
- **`sid` strings as the only session key**: the shipped shape of #416, and the follow-up review broke it twice. A cancelled transform stores no `sid`, and a reused `sid` names two different sessions. Both need provenance that exists independent of wire keys, which is the token.
- **A `WeakMap` from request object to session**: zero public surface, but identity-keyed. A player that spread-clones the request between decoration and response breaks the link, and serialization across a worker boundary breaks it completely. A `customData` field survives both, and `customData.cmcd` already established that decorated requests carry reporter-written state.
- **Storing the token inside `customData.cmcd`**: pollutes the wire-data type with a non-CMCD member, and `recordResponseReceived()` merges stored `cmcd` data into the event report, so the token would need stripping at every consumption site.
- **A bare numeric generation counter**: collides across reporter instances. Reporter B's generation 2 is not reporter A's generation 2, and a collision mis-attributes instead of falling back. The instance-scoped token makes foreign tokens recognizable.
- **A random per-session id with no instance scope**: cannot distinguish "my evicted session" (drop, rule 2) from "another reporter's session" (fall back, rule 3). One of the two cases would get the wrong behavior.

## Prior art

- **hls.js** (`CMCDController`) and **dash.js** (`CmcdModel`) keep one live session's identity in instance fields and stamp the current `sid` at request time. Neither retains prior-session state, so both relabel late responses. That is the ecosystem default this proposal moves away from.
- **Shaka Player** (`CmcdManager`) is the same shape: current-session fields, no retention.
- **The report-transforms RFC** (`rfc/cmcd-reporter-middleware.md`) established the two mechanisms this design reuses: reporter-written state on `customData`, and the bounded copier that is complete for the CMCD value space.

## Unresolved questions

1. **The field name.** `cmcdSession` is proposed for symmetry with `cmcd`. Alternatives: `cmcdProvenance`, or nesting under a single reserved object to stop consuming further top-level `customData` names.
2. **The default window.** `3` is proposed from the ad-pod reasoning above. Adopters with real traffic should say whether stale responses ever arrive more than two sessions late in practice.
3. **Foreign-token fallback.** Rule 3 preserves `sid`-level attribution for setups where one reporter records responses for requests another reporter decorated. If nobody runs that topology, dropping foreign tokens would be simpler and stricter.

## Future possibilities

- Child reporters ([PR #398](https://github.com/streaming-video-technology-alliance/common-media-library/pull/398)) share session state by construction: children read the root's current session object, and a `sid` change swaps one object instead of resetting scattered fields.
- Automatic starvation counters (`plans/cmcd-session-counters/design.md`) are session-scoped by definition and would live on the session object, with per-target `bsd` cursors following the same filter-aware gate rules as `msd`.
- Time-based eviction, if count-based retention proves wrong for some traffic shape.
- A drop signal (counter or debug callback) if silent drops turn out to hide real integration bugs.

## Revision history

- **2026-08-11 (v1)**: initial draft. Converts the retained-session design from `plans/cmcd-session-fixes/session-state.md` into a public proposal, corrected per the #416 follow-up review: provenance tokens on decorated requests (replacing `sid`-string-only attribution), drain before eviction, detached archived snapshots, and validation instead of coercion for `sessionRetention`.

## Final Decision

Pending community review.
