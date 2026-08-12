# Per-session state in CmcdReporter: design

Response to the four review findings on PR #416. Two of them (stale response relabeling, re-queued batches crossing sessions) are symptoms of one structural problem: session-scoped state lives in reporter-level fields that are reset in place, so anything that outlives a `sid` change (an in-flight request, an in-flight batch) loses its session. This design moves session-scoped state into per-session objects, retained for a configurable number of sessions, so late arrivals attribute to the session they belong to instead of being relabeled or guarded with epoch counters.

Scope: lands in #416, replacing the `sessionEpoch` guard and the restore-in-place 410 logic already on the branch. The `msd` upper-bound fix and per-URL disposal compose with it and are included here.

## The session object

```ts
type CmcdSession<C> = {
	sid: string
	data: Cmcd                     // persistent data store for this session
	msd: number                    // NaN until a valid update({ msd })
	lastEmitted: Partial<Pick<Cmcd, StateField>>
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTarget>
	requestTarget: CmcdTarget
}
```

`CmcdEventTarget` keeps `sn`, `msdSent`, `queue`, and `disposed`, and loses `intervalId` (timers move to the reporter, below).

Reporter fields:

```ts
private sessions = new Map<string, CmcdSession<C>>()   // insertion-ordered, oldest first
private session: CmcdSession<C>                        // the current session
private intervals = new Map<CmcdEventReportConfigNormalized<C>, ReturnType<typeof setInterval>>()
private started = false
```

Deleted from the branch: `this.sid`, `this.msd`, `this.data`, `this.eventTargets`, `this.requestTarget`, `this.lastEmitted`, `this.sessionEpoch` (all subsumed by the session object), plus the in-place restore logic in `resetSession()`.

## Lifecycle

- **Construction** creates the first session from the normalized config and inserts it into `sessions`.
- **`update({ sid })` with a new value** archives the current session where it sits, creates a fresh one, and evicts beyond the retention limit:
  - `next.data = { ...current.data }`, then the update payload merges into `next.data`. The store survives resets today (`cid`, `br`, custom keys persist), so the copy preserves that. It must be a copy: a shared reference would let the new session's updates mutate the archived session's frozen state, which is the relabeling bug at one remove. In-place mutation of arrays the caller handed us remains a documented caller hazard, unchanged.
  - Counters, gates, queues, `disposed`, `lastEmitted`, and `msd` start fresh, which is exactly what `resetSession()` does today, by construction instead of by mutation.
  - Timers are untouched: intervals keep ticking across resets (pinned behavior).
- **Sid reuse** (`s1 → s2 → s1`) deletes the archived `s1` entry and inserts the new one, so the reused name is a new session, not a resumption. The spec treats a `sid` change as a new session; a stale response from the original `s1` then attributes to the new `s1`, which is the caller's pathology to own.
- **Eviction** removes the oldest entries until `sessions.size <= sessionRetention`. An evicted session's queues die with it. An in-flight callback holding an evicted session's target can still write to it (a re-queue after rejection), but nothing drains evicted sessions, so the write is inert and the object is garbage-collected when the callback settles.

## Retention configuration

New public option on `CmcdReporterConfig`:

```ts
/**
 * The number of sessions the reporter retains state for, including the
 * current one. Retained sessions let a response that completes after a
 * `sid` change report under the session that issued its request. `1`
 * keeps only the current session, so stale responses are dropped.
 * Out-of-range and non-numeric values fall back to the default.
 *
 * @defaultValue 3
 */
sessionRetention?: number;
```

Normalization: integers `>= 1` are used as given (floored); anything else falls back to `3`. `Infinity` is accepted and means "never evict"; the TSDoc documents the memory consequence (queues of unsent reports accumulate per retained session). Default `3` covers a run of short sessions in quick succession, per review discussion.

This is the PR's only public API change. `cml-cmcd.api.md` gains the property, the changelog gets an `Added` entry, and the PR description's "no public API changes" claim is updated.

## Emission paths

Every path resolves a session first, then runs the existing logic against it. There is no separate stale path.

- **`update()`, `recordEvent()`, `start()` initial and interval events, `createRequestReport()`**: current session, unchanged behavior. Reserved-key stamping reads `session.sid`; the msd gate reads `session.msd` and the session's per-target flags.
- **`recordResponseReceived()`** resolves by the `sid` stored in the request's `customData.cmcd` (written by `createRequestReport()`):
  - Stored `sid` matches a retained session: emit into that session. The report merges `{ ...session.data, ...storedCmcd, ...derived, ...perCallData, sid: session.sid }`, consumes that session's next per-target `sn`, and can carry that session's `msd` if its gate is still open. An archived session's report is therefore labeled, sequenced, and contextualized by its own session, and the review repro flips from `cid="c1",sid="s2",sn=0` to `cid="c1",sid="s1"` with `s1`'s next `sn`.
  - Stored `sid` names an evicted session: drop the event. Attribution is impossible and relabeling is the bug this fixes. This is the only remaining drop, and `sessionRetention` controls how far back it starts.
  - No stored `sid` (request mode did not enable `sid`): current session. A stale response is undetectable in this configuration; the `recordResponseReceived()` TSDoc documents that enabling `sid` in request mode is what makes cross-session attribution possible.
- **State-change dedup** only ever consults the current session's `lastEmitted`. Archived sessions receive no state events (`recordResponseReceived()` is the only stale entry point, and `rr` is not a state-change event).

Wire consequence: a batch or POST body can interleave lines from different sessions. The spec has no delivery-deadline language, and the re-queue pin test already establishes that late, out-of-order delivery is tolerated with `sn` ordering the stream per session.

## Sending, 410, and re-queue

`processEventTargets()` and `flush()` drain every retained session's targets (skipping disposed ones), oldest session first so late reports tend to leave promptly.

`sendEventReport()` is called with the (session, config, batch) it is sending for. The response handler uses exactly that pair:

- **410**: dispose the target for that config in that session, and per CTA-5004-B's per-URL scoping, sweep every config in that session whose `url` matches (P2-2). Disposal disarms the config's timer only when the session is the current one; an archived session's disposal is bookkeeping (blocks its remaining queue) and leaves the live timer alone. No epoch guard: a delayed 410 from an old session disposes the old session's target, which is inert, and cannot touch the current session's.
- **429/5xx re-queue**: the catch closure already holds the batch's own target object, which now belongs to its session, so a failed session-A batch re-queues into A, not into whatever session is current. If A's target was disposed by a sibling 410, `disposed` blocks any further drain and eviction ends it. The generation counter from the earlier review plan is unnecessary.
- A 410 for a config that was already evicted with its session resolves to nothing and is ignored.

`start()` sets `started`, disarms and re-arms each config's timer, skips configs whose current-session target is disposed, and fires the initial report into the current session. A `sid` change with the reporter started re-arms timers for configs that were disposed in the previous session, because the new session's targets are fresh; this reproduces the restore behavior already pinned on the branch (including "no immediate report on restore", since resets never fire initial reports).

## msd upper bound (P2-1)

Unchanged location, one more condition: `update()` accepts a finite, non-negative number, rounds it, and rejects rounded values above the RFC 8941 structured-field integer maximum `999_999_999_999_999`. Without the bound, the serializer throws after the gate closed (request mode) or a queued batch fails on every retry (event mode). Verified on the branch: `1_000_000_000_000_000` closes the gate, `encodePreparedCmcd` throws `failed to serialize ... as Integer`, and a later valid value is suppressed.

## Behavior invariants

Pinned by existing tests and preserved:

- Single-session callers see byte-identical output. All current-session paths are the same logic reading `session.*` instead of `this.*`.
- Events queued before a `sid` change keep their old `sid`/`sn` and drain (they now live in the archived session's queues, which the drain loop covers).
- Timers tick across resets; repeated `start()` does not leak intervals; `stop()` disarms and clears `started`.
- Same-session 410 disposes for the remainder of that session; `stop(true)` flushes; 429/5xx re-queues re-send as-is.

Changed observable behavior, all within the four findings:

- A stale response reports under its own session (or drops if evicted or older than retention) instead of relabeling.
- A session-A batch invalidated by A's disposal is never retried into session B.
- Over-range `msd` is rejected instead of poisoning the gate or the queue.
- 410 disposes every same-URL config in the affected session.

## Interaction with the child-reporters RFC (#398)

The RFC's shared session state becomes "the current session object": children read and write `root.session`, and a `sid` change swaps one object instead of resetting scattered fields. Session-scoped counters from the starvation design pass (`plans/cmcd-session-counters/design.md`) would live on the session object the same way. The RFC's mixed-`sid` drain semantics are the per-session queues described here. No RFC text changes required before implementation; the feature PR consumes this structure as-is.

## Test plan

New coverage, in addition to reworking the branch's epoch/restore tests onto the new structure:

- Stale response attribution: the review repro emits `cid="c1",sid="s1"` with `s1`'s next `sn`; a stale response can carry `s1`'s unsent `msd`; snapshot keys come from `s1`'s frozen data, not the live store.
- Attribution boundaries: evicted session drops; no stored `sid` emits as current; `sessionRetention: 1` drops any stale response; retention normalization table (`0`, `-1`, `NaN`, `2.5`, `undefined`).
- Cross-session re-queue: failed A-batch re-queues into A and drains under A's `sid`; after a sibling 410 in A it never sends; after A's eviction it never sends.
- 410 scoping: delayed 410 from an archived session leaves the current session sending; per-URL sweep disposes same-URL sibling configs in the affected session only; timer disarm only for current-session disposal.
- Sid reuse: `s1 → s2 → s1` starts fresh counters and drops the original `s1`'s stale responses.
- `msd` bound: `999_999_999_999_999` accepted, `999_999_999_999_999.4` rounds in, `1e15` rejected, gate stays open after rejection.
