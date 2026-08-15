# CmcdReporter internal architecture

Design record for restructuring `CmcdReporter`'s internals into four units with single ownership: a session ledger, per-playback state, a pure report pipeline, and per-target outboxes. The public API does not change, which is why this is a plan rather than an RFC. Implementation steps are in [steps.md](steps.md).

Baseline: `main` at `18f38f041` (PR #416, the v13 session-retention implementation). Line references below are to `libs/cmcd/src/CmcdReporter.ts` at that commit.

Revised per the PR #421 self-review: the player unit is renamed (the public `CmcdPlayerState` type already names the `sta` enum), `bg` and its baseline are session-owned, request targets are a keyed map, attribution is player-aware, stamping is two-phase, eviction defers to active fan-outs, and five known defects from the #416 final review are fixed rather than preserved.

## Problem

`CmcdReporter` is one mutable class doing five jobs:

1. **Session bookkeeping**: `sid` identity, retention, archival, counters, gates, dedup baselines
2. **Report assembly**: merging data sources and stamping reporter-owned fields
3. **Policy**: transforms and key filters, with copy-isolation and required-key guarantees
4. **Delivery**: queues, batching, retry, HTTP 410 disposal, timers
5. **Facade**: the player-facing API and its `customData` typing

Because all five share one object, every invariant is enforced by call-site discipline and comment-documented ordering: "stamp after transform", "consume the gate only when the filter retains the key", "drain before evict", "pin the session before fan-out". The revision histories of the transforms RFC (v4, v5) and the session-retention RFC (v9 through v13) are a log of pairwise feature interactions that nothing in the structure prevented, each discovered in review: transforms × required keys, transforms × dedup × error propagation, sessions × queues, sessions × 410, provenance × cancelled transforms, provenance × serialization, `sid` reuse × retention. Pairwise interactions grow quadratically with features, and two features are queued (child reporters, automatic starvation counters) that each multiply the cross-products again.

Two failures of the current abstraction are already visible:

**`CmcdSession` conflates playback state with session state.** The child-reporters RFC's state-partition table says the data store and the state-change dedup baseline are per player, while `sid`, `sn` counters, `msd` gates, queues, timers, and `bg` are per session. Today `data` and `lastEmitted` sit inside `CmcdSession` (lines 334 to 352) because there is only one player. The children PR would have to perform surgery on the object the retention work just built, re-litigating every invariant under multi-writer conditions.

**Retention × children does not compose.** Retention archives `session.data` (one store) so late responses report the issuing session's snapshot. Children make data per player. When a child's request outlives a session rotation, the current structure has no answer for whose archived data its response draws from. The two designs were built against different internal models. This document resolves the composition (see Player-aware attribution) instead of deferring it.

## Goals

- Make the ordering invariants structural (function composition order and type ownership) instead of disciplinary (comments and review vigilance).
- Give the two queued features obvious landing zones: children become a second facade over shared state; counters become session-ledger state consumed in the stamp stage.
- Zero public API change: `cml-cmcd.api.md` must not change.
- No behavior change except five enumerated defect fixes carried over from the #416 final review (see Known defects), each landed with its own regression test and changelog entry. Existing tests are never edited.
- Zero cost to the priorities: no new per-report allocations on paths that have none today, no new runtime exports, no effect on tree-shaking for non-reporter consumers.

## Non-goals

- No public API additions or changes. The RFC-vetted semantics (per-placement transforms, `sid`-keyed provenance records, retention windows, silent-drop conventions) are all kept exactly. The one typed provenance addition this design anticipates (`pid`) is explicitly deferred to a child-reporters RFC amendment and is not minted here.
- No middleware bus, event emitter, plugin registry, or interface indirection. The transforms RFC already rejected those shapes for this library, and CML's performance and bundle priorities punish them.
- No implementation of children or counters. This restructures so those features land cleanly; it does not build them.

## The four units

All new modules are internal: none is exported from `index.ts`, so the public surface and the API report are untouched.

### 1. `CmcdPlaybackState` (per playback)

What one playback owns, straight from the child RFC's partition table ("a child owns the state of its own playback"). Named `CmcdPlaybackState` because `CmcdPlayerState` is existing public API: the `sta` const enum in `src/CmcdPlayerState.ts`, re-exported from `index.ts`.

```ts
export type CmcdStateField = 'sta' | 'pr' | 'cid' | 'br'

export type CmcdPlaybackState = {
	/** Stable identity of this playback within the reporter. The root is CMCD_ROOT_PID. */
	pid: string;
	/** The ledger epoch this playback last observed; used for lazy baseline reset. */
	epoch: number;
	/** Persistent data store for this playback. */
	data: Cmcd;
	/** Frozen base provenance record: this playback's issue-time identity. */
	provenance: CmcdRequestProvenance;
	/** Last wire-emitted value per playback-owned state field (dedup baseline). */
	lastEmitted: Partial<Pick<Cmcd, CmcdStateField>>;
}
```

`bg` is deliberately absent from `CmcdStateField`: its value and its dedup baseline are session-owned (see below), because the key asserts a fact about every player in the session and no single playback can establish it.

The base provenance record lives on the playback, not the session, because its `cid` member is the playback's: each child has its own `cid`, so per-playback records fall out naturally. It is re-minted on that playback's `cid` change and on session rotation.

`epoch` exists for children. The root playback is recreated eagerly at rotation, but children cannot be enumerated (the root holds no child registry, by design), so each child notices a rotation lazily: on its next call, its `epoch` differs from the ledger's, and it clears its own `lastEmitted` before proceeding. The refactor adds the field and the sync check now (one integer compare at the emit entry point, inert for the single eagerly-reset root) so children do not have to retrofit the dedup path.

The reporter holds exactly one of these today. State-change acceptance (the write-through, the required-field guard, the dedup comparison, the baseline commit, currently lines 739 to 762) moves to `acceptStateChange(playback, session, type, data): boolean`, which routes `bg` to the session's value and baseline and every other tracked field to the playback's. This function is also where the counters plan hooks: an accepted `sta` transition into or out of `'r'` is exactly the fact the session ledger aggregates.

### 2. `CmcdSessionState` and `CmcdSessionLedger` (per session)

Everything CTA-5004-B scopes to the `sid`:

```ts
export type CmcdTargetStamps = {
	sn: number;
	msdSent: boolean;
}

export type CmcdSessionState<C> = {
	sid: string;
	/** Monotonic insertion index, for oldest-first ordering of dirty sessions. */
	seq: number;
	msd: number;
	/** Session-wide backgrounded state and its dedup baseline (root-written once children exist). */
	bg?: boolean;
	bgEmitted?: boolean;
	/** Frozen data snapshots archived at rotation, keyed by playback id. Empty while current. */
	snapshots: Map<string, Cmcd>;
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTargetState>;
	/** Request-mode counters and gates, keyed by request target identity. */
	requestTargets: Map<string, CmcdTargetStamps>;
}

type CmcdEventTargetState = CmcdTargetStamps & {
	outbox: CmcdOutbox;
}
```

`requestTargets` is a map, not a scalar, because child-reporters RFC v4 resolved request-mode `sn` and `msd` state as session-owned per configured target identity, with a default identity preserving current output. The refactor uses one entry under `CMCD_DEFAULT_REQUEST_TARGET` (no config member exists yet to name others), so the wire is unchanged, and the children PR adds the public `target` config key without touching session state again.

`bg` carries across rotation (the page is still hidden after a `sid` change) while `bgEmitted` resets with the new session object, so the first backgrounded-mode event of a new session emits, exactly as the single dedup baseline behaves today.

`CmcdSessionLedger` owns the `Map<sid, CmcdSessionState>`, the current pointer, the rotation epoch, the retention policy, and the dirty set (see Delivery): `resolve(provenance)` (structural `sid` read, from today's `resolveSession`, lines 1024 to 1032), `rotate(next, pid, snapshot)` (archives the issuing playback's snapshot on the outgoing session, increments the epoch, delete-first re-insert so a reused `sid` lands at the newest position, lines 650 to 651), and `evict()` (oldest first, never the current session). The transition ordering (detach, create, insert, drain, evict, re-arm) stays in the facade's rotation method, but each step is a named ledger operation.

**Eviction defers to active fan-outs.** A synchronous transform can rotate the session mid-fan-out; with `sessionRetention: 0`, eager eviction destroys the pinned session before later targets enqueue into it, and those reports are silently lost (an open finding from the #416 final review). The facade keeps a fan-out depth counter, incremented and decremented (try/finally) around every per-target loop; `evict()` requests made while the depth is nonzero are deferred and run when the outermost fan-out completes, after the ordinary post-fan-out processing pass has drained what the pinned session queued.

The counters plan lands here: accepted-transition totals (`bsa`), accumulated and completed spans (`bsda`, `bsd`), per-key application-owned flags (supplied-value precedence), and per-target `bsd` delivery cursors are all `CmcdSessionState` members, cleared by rotation like everything else in the object.

### Player-aware attribution

The retention × children composition is resolved now, not deferred:

- Every playback has a stable `pid` (the root uses the module constant `CMCD_ROOT_PID`).
- Rotation archives the issuing playback's data into the outgoing session's `snapshots` map under its `pid`. The refactor archives the root eagerly; children later archive lazily on their first post-rotation call (the same `epoch` sync that resets their baseline writes their pre-rotation store into the outgoing session, which retention still holds).
- Response attribution resolves the session by the record's `sid` exactly as today, then selects the data source: `session.snapshots.get(record.pid ?? CMCD_ROOT_PID)` for an archived session, or the issuing playback's live data for the current one. Every record the reporter mints today carries no `pid`, and hand-built `{ sid }` records never will, so both resolve to the root snapshot: bit-identical to today's single-snapshot behavior.
- The typed, minted `pid` member on `CmcdRequestProvenance` is a public API addition and therefore belongs to the child-reporters RFC (as an amendment to its request-decoration section). This refactor builds the structure and the resolution rule but mints nothing, so the record type, its freeze, and its serialization bridge are untouched.

Snapshot semantics stay rotation-time (the store as it stood at the transition) with the record's issue-time `cid` overriding, exactly the v13 split. The alternative, capturing the full playback store on the request record at issue time, was considered and rejected: it changes the documented semantics and adds an encode to every request, including the no-per-call-data requests that today share one frozen base record and pay nothing.

### 3. The report pipeline (pure functions)

Report production becomes a fixed composition:

```text
assemble -> applyPolicy -> stamp -> encode -> commit
```

- **Assembly** stays an inline spread at the top of each path (it is one expression; a helper would add nothing). The data source is the snapshot-or-live rule above, then the session's `bg` (when set), then per-call data, so archived sessions draw from their frozen snapshot, the current session draws live, and `bg` rides every report of its session without living in any playback's store.
- **`applyReportPolicy(report, transform, request, requiredKey, restoreTs)`** is the one place the transform contract lives: the deep copy before a configured transform (`copyReportValues`), the null-cancellation check, and required-key and `ts` restoration ("restore, never fabricate"). Today this logic is duplicated with variations between `recordTargetEvent` (lines 816 to 854) and `createRequestReport` (lines 1140 to 1153); the `restoreTs` flag encodes the one real difference (request-mode reports have no `ts` obligation) instead of leaving it implicit in the duplication.
- **`stampReport(...)`** writes the reporter-owned fields after policy has run: `e`, `sid`, `sn`, and `msd` attach-or-strip. It writes the *current* counter value and consumes nothing.
- **Commit is a separate step, after encoding succeeds.** Today `sn++` runs and the `msd` gate closes before `encodeCmcd` can throw, so an unserializable value permanently burns a sequence number and can eat the session's `msd` without anything reaching the queue (an open finding from the #416 final review). In the new shape the caller stamps with the current counter, encodes, enqueues, and only then commits `sn`, `msdSent`, and (later) `bsd` cursors, atomically. "A cancelled report consumes nothing" and "a failed encode consumes nothing" both fall out of ordering. Gate consumption keeps its two mode shapes at the commit site: event mode commits at enqueue when the target's key filter retains `msd`; request mode commits after `prepareCmcdData`, when the prepared output shows the key survived (lines 1184 to 1186).
- **Encode** is the existing `encodeCmcd` / `prepareCmcdData` / `encodePreparedCmcd`, unchanged. Encode-at-enqueue is kept: a value that cannot serialize still throws inside the recording call that produced it; it just no longer corrupts counters.

Every event source (an `update()` auto-fire, a `recordEvent()` call, a derived `RESPONSE_RECEIVED`, an interval tick, `start()`'s initial tick) enters the same path with the same descriptor shape. The `start()` fan-out session-pinning fix (lines 460 to 464) stays, but it protects one shared path instead of one of several hand-rolled variants.

### 4. `CmcdOutbox` (per session, per event target)

Delivery, with no CMCD knowledge: a queue of encoded lines, `push`, batch extraction by `batchSize` or drain, the POST via the injected requester, re-queue-at-front on 429/5xx, and disposal (410). One instance per event target per session, created at session creation, so a delayed 410 or a failed batch lands in its own session's outbox exactly as today (lines 1211 to 1316).

Two callbacks are bound once, at construction, so steady-state processing allocates nothing: `onGone` (the facade's same-URL disposal for this session, invoked on 410) and `onDirty` (marks the session dirty when an async failure re-queues lines outside a processing pass).

**Dirty tracking replaces the full scan.** Today every processing pass walks every retained session and every target, so with `sessionRetention: Infinity` ordinary reporting scales with session history (an open finding from the #416 final review). The ledger instead keeps a set of sessions with non-empty outboxes: enqueue and re-queue mark, a pass that empties a session's outboxes unmarks. A pass takes the dirty sessions, orders them oldest-first by `seq` (one small array allocation, only when there is work), and processes only those. Idle passes and clean sessions cost a set lookup.

Interval timers are event sources, not delivery: they stay on the root facade, keyed by target config, ticking across session rotations exactly as today (lines 383 to 388).

### The facade

`CmcdReporter` keeps its exact public surface and becomes translation: public calls become ledger operations, pipeline runs, and outbox pushes. A child reporter later is a second, smaller facade holding its own `CmcdPlaybackState` and a reference to the shared ledger and outboxes; `activate()` is a pointer in the ledger. The `Pick`-based injected-reporter type in the child RFC gets simpler because the facade is small.

## Known defects: fixed, not preserved

The #416 final review left five findings in the merged baseline, all reproducible with the suite green. Preserving them faithfully through a refactor would launder them into load-bearing behavior. Each is fixed in the task that restructures its code path, with a red-then-green regression test and a changelog entry:

| Defect (open #416 finding) | Fix site |
|---|---|
| `sn`/`msdSent` committed before encode can throw, corrupting sequence and gate | Pipeline commit step (Task 4) |
| Eviction destroys a session an active fan-out still holds (`sessionRetention: 0` + rotating transform) | Deferred eviction (Task 3) |
| `copyItemValue` shares mutable structured-field internals (`SfToken` values, `Uint8Array` params and values) | Copy-utility extraction (Task 1) |
| `stop()` during `start()`'s fan-out leaves later targets' timers armed and reporting | Tick unification (Task 6) |
| Every processing pass scans all retained sessions | Dirty tracking (Task 5) |

## Where the queued features land

| Feature | Landing zone |
|---|---|
| Child reporters (root/child split, shared `sn`/`msd`/queues, per-playback data and dedup) | Second facade over the shared ledger and outboxes; `CmcdPlaybackState` instance per child with lazy epoch sync and lazy snapshot archival; `activate()` pointer, root-owned `bg`, and per-identity `requestTargets` already in place; the `pid` provenance member lands via the child-reporters RFC |
| Automatic starvation counters (`bsa`, `bsda`, `bsd`) | Transition detection in `acceptStateChange`; totals, spans, and supplied-value flags on `CmcdSessionState`; per-target `bsd` cursors committed in the pipeline's commit step under the same filter-aware rule as `msd` |
| Session retention (already implemented) | Absorbed: the ledger is the retention structure; archived snapshots become the explicit per-playback `snapshots` map instead of a repurposed live field |

## Performance and bundle

- No new per-report allocations on paths that have none today. `update()`'s auto-fire iterates the module-level state-field table and lets the shared dedup in the emit path suppress non-changes (the current pre-check is a duplicate of that dedup, not a distinct behavior). Outbox callbacks are bound once at session creation. Dirty-set processing allocates one ordered array per pass that has work, and nothing when idle.
- New allocations, enumerated: one `CmcdOutbox` plus its two bound callbacks per target at session creation (replacing the plain queue-holding object created there today), one `CmcdPlaybackState` per reporter, one `requestTargets` map entry per session, and the ledger's dirty set.
- Module-level pure functions minify at least as well as private methods (no `this`, mangleable names, no prototype chain).
- No new exports from `index.ts`, so tree-shaking for non-reporter consumers is untouched, and reporter consumers pull the same graph either way.
- No side effects at module scope in any new file, per the repo rule.

## Testing strategy

The 4691-line `CmcdReporter.test.ts` suite pins the composed behavior through the public API and a mock requester. It is necessary but not sufficient: the exact #416 baseline was green while all five known defects existed. The rules are therefore:

- Existing test cases are never edited. A step that seems to require editing one is an unplanned behavior change: stop and escalate.
- New tests are added in two cases only: a red-then-green regression test inside each task that fixes a known defect, and characterization tests where a task needs to pin behavior the suite leaves unstated. Additions are enumerated in the task that makes them; the final task verifies the test diff contains additions only.
- No new public members means no new API-surface tests, and internal units are deliberately not tested directly (they are private implementation; the suite plus the enumerated additions pin their composed behavior).

## Sequencing

PR #416 has merged, so this work can start as soon as the plan is agreed. It belongs before, or as the first commits of, the child-reporters implementation, since children force the playback/session split anyway. The counters implementation then follows the child-reporters PR per the existing decision in `plans/cmcd-session-counters/design.md`.
