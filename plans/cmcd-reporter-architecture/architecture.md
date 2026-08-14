# CmcdReporter internal architecture

Design record for restructuring `CmcdReporter`'s internals into four units with single ownership: a session ledger, per-player state, a pure report pipeline, and per-target outboxes. The public API does not change, which is why this is a plan rather than an RFC. Implementation steps are in [steps.md](steps.md).

Baseline: `main` at `18f38f041` (PR #416, the v13 session-retention implementation). Line references below are to `libs/cmcd/src/CmcdReporter.ts` at that commit.

## Problem

`CmcdReporter` is one mutable class doing five jobs:

1. **Session bookkeeping**: `sid` identity, retention, archival, counters, gates, dedup baselines
2. **Report assembly**: merging data sources and stamping reporter-owned fields
3. **Policy**: transforms and key filters, with copy-isolation and required-key guarantees
4. **Delivery**: queues, batching, retry, HTTP 410 disposal, timers
5. **Facade**: the player-facing API and its `customData` typing

Because all five share one object, every invariant is enforced by call-site discipline and comment-documented ordering: "stamp after transform", "consume the gate only when the filter retains the key", "drain before evict", "pin the session before fan-out". The revision histories of the transforms RFC (v4, v5) and the session-retention RFC (v9 through v13) are a log of pairwise feature interactions that nothing in the structure prevented, each discovered in review: transforms × required keys, transforms × dedup × error propagation, sessions × queues, sessions × 410, provenance × cancelled transforms, provenance × serialization, `sid` reuse × retention. Pairwise interactions grow quadratically with features, and two features are queued (child reporters, automatic starvation counters) that each multiply the cross-products again.

Two failures of the current abstraction are already visible:

**`CmcdSession` conflates player state with session state.** The child-reporters RFC's state-partition table says the data store and the state-change dedup baseline are per player, while `sid`, `sn` counters, `msd` gates, queues, timers, and `bg` are per session. Today `data` and `lastEmitted` sit inside `CmcdSession` (lines 334 to 352) because there is only one player. The children PR would have to perform surgery on the object the retention work just built, re-litigating every invariant under multi-writer conditions.

**Retention × children does not compose.** Retention archives `session.data` (one store) so late responses report the issuing session's snapshot. Children make data per player. When a child's request outlives a session rotation, the current structure has no answer for whose archived data its response draws from. The two designs were built against different internal models.

## Goals

- Make the ordering invariants structural (function composition order and type ownership) instead of disciplinary (comments and review vigilance).
- Give the two queued features obvious landing zones: children become a second facade over shared state; counters become session-ledger state consumed in the stamp stage.
- Zero public API change: `cml-cmcd.api.md` must not change. Zero behavior change: the existing `CmcdReporter.test.ts` suite passes without a single edit.
- Zero cost to the priorities: no new per-report allocations on paths that have none today, no new runtime exports, no effect on tree-shaking for non-reporter consumers.

## Non-goals

- No public API additions or changes. The RFC-vetted semantics (per-placement transforms, `sid`-keyed provenance records, retention windows, silent-drop conventions) are all kept exactly.
- No middleware bus, event emitter, plugin registry, or interface indirection. The transforms RFC already rejected those shapes for this library, and CML's performance and bundle priorities punish them.
- No implementation of children or counters. This restructures so those features land cleanly; it does not build them.

## The four units

All new modules are internal: none is exported from `index.ts`, so the public surface and the API report are untouched.

### 1. `CmcdPlayerState` (per player)

What one playback owns, straight from the child RFC's partition table:

```ts
export type CmcdStateField = 'sta' | 'pr' | 'cid' | 'bg' | 'br'

export type CmcdPlayerState = {
	/** Persistent data store for this player's playback. */
	data: Cmcd;
	/** Last wire-emitted value per tracked state field (dedup baseline). */
	lastEmitted: Partial<Pick<Cmcd, CmcdStateField>>;
}
```

The reporter holds exactly one today. Children later mean N of these sharing one ledger. State-change acceptance (the write-through, the required-field guard, the dedup comparison, the baseline commit, currently lines 739 to 762) moves to a function over this type, `acceptStateChange(player, type, data): boolean`, with a sibling `pendingStateEvents(player, data): CmcdEventType[]` serving `update()`'s auto-fire loop. This function is also where the counters plan hooks: an accepted `sta` transition into or out of `'r'` is exactly the fact the session ledger aggregates.

### 2. `CmcdSessionState` and `CmcdSessionLedger` (per session)

Everything CTA-5004-B scopes to the `sid`:

```ts
export type CmcdTargetStamps = {
	sn: number;
	msdSent: boolean;
}

export type CmcdSessionState<C> = {
	sid: string;
	provenance: CmcdRequestProvenance;
	msd: number;
	/** Frozen data snapshot archived at rotation; undefined while current. */
	snapshot?: Cmcd;
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTargetState>;
	requestTarget: CmcdTargetStamps;
}

type CmcdEventTargetState = CmcdTargetStamps & {
	outbox: CmcdOutbox;
}
```

The `snapshot` member is the archived player data written at rotation, replacing today's arrangement where the archived session's live `data` field doubles as the snapshot. While a session is current, event assembly reads the player's live data; once archived, it reads the frozen snapshot. This is also the seam that answers the retention × children gap: with N players, rotation archives the issuing player's data per session (or, later, per session and player), and the provenance record can name the issuing player the same way it names the `sid`.

`CmcdSessionLedger` owns the `Map<sid, CmcdSessionState>`, the current pointer, and the retention policy: `resolve(sid)` (structural read, from today's `resolveSession`, lines 1024 to 1032), `rotate(next, snapshot)` (delete-first re-insert so a reused `sid` lands at the newest position, lines 650 to 651), `evict()` (oldest first, never the current session, returns the evicted sessions), and oldest-first iteration for drain. The transition ordering (detach, create, insert, drain, evict, re-arm) stays in the facade's rotation method, but each step is now a named ledger operation instead of inline map manipulation.

The counters plan lands here: accepted-transition totals (`bsa`), accumulated and completed spans (`bsda`, `bsd`), per-key application-owned flags (supplied-value precedence), and per-target `bsd` delivery cursors are all `CmcdSessionState` members, cleared by rotation like everything else in the object.

### 3. The report pipeline (pure functions)

Report production becomes a fixed composition:

```text
assemble -> applyPolicy -> stamp -> encode
```

- **Assembly** stays an inline spread at the top of each path (it is one expression; a helper would add nothing). The data source is `session.snapshot ?? player.data`, so archived sessions draw from their frozen snapshot and the current session draws live.
- **`applyReportPolicy(report, transform, request, requiredKey, restoreTs)`** is the one place the transform contract lives: the deep copy before a configured transform (`copyReportValues`), the null-cancellation check, and required-key and `ts` restoration ("restore, never fabricate"). Today this logic is duplicated with variations between `recordTargetEvent` (lines 816 to 854) and `createRequestReport` (lines 1140 to 1153); the `restoreTs` flag encodes the one real difference (request-mode reports have no `ts` obligation) instead of leaving it implicit in the duplication.
- **`stampReport(...)`** writes the reporter-owned fields after policy has run: `e`, `sid`, `sn` (incrementing the session's per-target counter), and `msd` attach-or-strip. It is the only stage that touches session counters. "A cancelled report consumes neither a sequence number nor `msd`" falls out of `null` short-circuiting before stamp; "a transform cannot corrupt sequencing or session identity" falls out of stamp running after policy. Gate consumption keeps its two current shapes (event mode consumes at enqueue when the target's key filter retains `msd`, line 884; request mode confirms against the prepared output, line 1184), each expressed at its call site against the same `CmcdTargetStamps` object. The counters plan's per-target `bsd` cursors advance here too, same filter-aware rule as `msd`.
- **Encode** is the existing `encodeCmcd` / `prepareCmcdData` / `encodePreparedCmcd`, unchanged. Encode-at-enqueue is kept: a value that cannot serialize still throws inside the recording call that produced it.

Every event source (an `update()` auto-fire, a `recordEvent()` call, a derived `RESPONSE_RECEIVED`, an interval tick, `start()`'s initial tick) enters the same path with the same descriptor shape. The `start()` fan-out session-pinning fix (lines 460 to 464) stays, but it protects one shared path instead of one of several hand-rolled variants.

### 4. `CmcdOutbox` (per session, per event target)

Delivery, with no CMCD knowledge: a queue of encoded lines, `push`, batch extraction by `batchSize` or drain, the POST via the injected requester, re-queue-at-front on 429/5xx, and disposal (410). One instance per event target per session, created at session creation, so a delayed 410 or a failed batch lands in its own session's outbox exactly as today (lines 1211 to 1316). The orchestration loop (sessions oldest first, archived sessions always drain-eligible, same-URL sibling disposal within a session, the reprocess pass) stays in the facade as one small private method driving outbox operations.

Interval timers are event sources, not delivery: they stay on the root facade, keyed by target config, ticking across session rotations exactly as today (lines 383 to 388).

### The facade

`CmcdReporter` keeps its exact public surface and becomes translation: public calls become ledger operations, pipeline runs, and outbox pushes. A child reporter later is a second, smaller facade holding its own `CmcdPlayerState` and a reference to the shared ledger and outboxes; `activate()` is a pointer in the ledger. The `Pick`-based injected-reporter type in the child RFC gets simpler because the facade is small.

## Where the queued features land

| Feature | Landing zone |
|---|---|
| Child reporters (root/child split, shared `sn`/`msd`/queues, per-player data and dedup) | Second facade over the shared ledger and outboxes; `CmcdPlayerState` instance per child; `activate()` pointer and root-owned `bg` in the ledger |
| Automatic starvation counters (`bsa`, `bsda`, `bsd`) | Transition detection in `acceptStateChange`; totals, spans, and supplied-value flags on `CmcdSessionState`; per-target `bsd` cursors consumed in the stamp stage under the same filter-aware rule as `msd` |
| Session retention (already implemented) | Absorbed: the ledger is the retention structure; archived snapshots become an explicit `snapshot` member instead of a repurposed live field |

## Performance and bundle

- No new per-report work. The deep copy still runs only where a transform is configured; assembly is the same spreads; stamping is the same field writes. The only new allocations are one `CmcdOutbox` per target at session creation (which replaces the plain queue-holding object created there today) and one `CmcdPlayerState` per reporter.
- Module-level pure functions minify at least as well as private methods (no `this`, mangleable names, no prototype chain).
- No new exports from `index.ts`, so tree-shaking for non-reporter consumers is untouched, and reporter consumers pull the same graph either way.
- No side effects at module scope in any new file, per the repo rule.

## Testing strategy

The 4691-line `CmcdReporter.test.ts` suite drives the public API through a mock requester and encoded wire output. It is the specification. The refactor is complete only if that suite passes with zero edits at every step; any step that seems to require a test change is a behavior change and stops the work. No new public members means no new tests are required, and internal units are deliberately not tested directly (they are private implementation; the suite pins their composed behavior).

## Sequencing

PR #416 has merged, so this work can start as soon as the plan is agreed. It belongs before, or as the first commits of, the child-reporters implementation, since children force the player/session split anyway. The counters implementation then follows the child-reporters PR per the existing decision in `plans/cmcd-session-counters/design.md`.
