# CMCD State-Change Event Deduplication Design

**Date:** 2026-05-22
**Component:** `libs/cmcd/src/CmcdReporter.ts`
**Type:** Behavioral fix + minor API addition

## Problem

`CmcdReporter` emits state-change events on every call, regardless of whether the underlying state actually changed. The CTA-5004-B spec defines these events as transition markers, so duplicates are noise:

- `ps` (play state change)
- `pr` (playback rate change)
- `c` (content ID change)
- `b` (backgrounded mode change)
- `bc` (bitrate change)

Compounding the problem, the two entry points for state data disagree about persistence:

- `update({ sta: 'p' })` persists into `this.data.sta`, no event.
- `recordEvent(PLAY_STATE, { sta: 'p' })` puts `sta` on that one event report but does not update `this.data.sta`.

This forces developers to remember the two-step pattern (`update()` + `recordEvent()`) and to know which keys correspond to which events.

## Goals

1. Suppress consecutive state-change events that carry the same effective value.
2. Make `update()` and `recordEvent()` agree on persistent data for state fields.
3. Auto-fire the appropriate state-change event when `update()` mutates a tracked field.
4. Single declarative source of truth mapping fields → events → equality rules.

## Non-goals

- Paired toggle events (`m`/`um`, `pe`/`pc`). These have no state field and need a different algorithm. Deferred to a follow-up spec.
- Dedup for non-change events (`e`, `t`, `rr`, ad lifecycle, `sk`, `ce`).
- Configurable opt-out. Dedup matches the spec definition of these events; if a player wants duplicates, they have a bug, not a use case.

## Prerequisites

`pr` is documented in `CmcdEvent.ts:48` as a valid CMCD v2 event but is missing from `CmcdEventType.ts` and `CMCD_TOKEN_VALUES.ts`. Add it before the dedup work:

- `CmcdEventType.ts`: add `CMCD_EVENT_PLAYBACK_RATE = 'pr' as const` and a `PLAYBACK_RATE` entry on the `CmcdEventType` collector object, mirroring the existing pattern.
- `CMCD_TOKEN_VALUES.ts`: add `'pr'` to the `e` token list.

## Design

### Dispatch table

A module-scope, frozen list co-locates field, event, and equality function for each tracked state change. One row per dedup-able event:

```ts
const STATE_FIELDS = [
    { field: 'sta', event: CmcdEventType.PLAY_STATE,        equal: (a, b) => a === b },
    { field: 'pr',  event: CmcdEventType.PLAYBACK_RATE,     equal: (a, b) => a === b },
    { field: 'cid', event: CmcdEventType.CONTENT_ID,        equal: (a, b) => a === b },
    { field: 'bg',  event: CmcdEventType.BACKGROUNDED_MODE, equal: (a, b) => a === b },
    { field: 'br',  event: CmcdEventType.BITRATE_CHANGE,
        equal: (a, b) => (a === undefined || b === undefined) ? a === b : cmcdObjectTypeListEqual(a, b) },
] as const
```

Adding a future dedup-able event is a single row. The equality function is co-located with the field that needs it, so list-typed fields (`br` and any future siblings) carry their own equality without polluting the scalar comparison path.

The `br` entry wraps `cmcdObjectTypeListEqual` to handle `undefined` values that can arise from `this.data.br` or `this.lastEmitted.br` before either has been set. This keeps the helper's type contract tight (it only accepts defined arrays) while preserving correct dispatch-site semantics.

### Equality helper for `br`

`br` is `CmcdObjectTypeList`: an array of `number | SfItem<number, ExclusiveRecord<CmcdObjectType, boolean>>`. Reference equality (`===`) fails when players reconstruct the array between updates. A type-specific helper handles it:

```ts
function cmcdObjectTypeListEqual(a: CmcdObjectTypeList, b: CmcdObjectTypeList): boolean {
    if (a === b) return true
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        const ai = a[i]
        const bi = b[i]
        if (ai === bi) continue
        if (typeof ai === 'number' || typeof bi === 'number') return false

        // Both are SfItem<number, ExclusiveRecord<CmcdObjectType, boolean>>
        if (ai.value !== bi.value) return false

        // ExclusiveRecord: params (when defined) has exactly one key
        const ap = ai.params
        const bp = bi.params
        const ak = ap && Object.keys(ap)[0]
        if (ak !== (bp && Object.keys(bp)[0])) return false
        if (ak !== undefined && ap![ak as keyof typeof ap] !== bp![ak as keyof typeof bp]) return false
    }

    return true
}
```

The comparison is order-sensitive: `[video, audio]` and `[audio, video]` produce different on-the-wire encodings and are therefore different for dedup. Players that construct `br` arrays consistently get correct dedup; those that shuffle get spurious emits, which is the safer failure mode.

The function is a module-level helper in `CmcdReporter.ts`, not exported. Tests cover it through the reporter's public API.

### Dedup field

A new private instance field on `CmcdReporter` holds the last-emitted value per tracked field:

```ts
private lastEmitted: Partial<Pick<Cmcd, 'sta' | 'pr' | 'cid' | 'bg' | 'br'>> = {}
```

This is intentionally separate from `this.data` because `update()` can mutate `this.data` silently for non-tracked fields, and the dedup baseline must reflect what was last reported on the wire.

### `recordEvent` algorithm

When called with a dedup-able event type, `recordEvent` performs write-through then dedup before falling through to the existing target loop:

```ts
recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
    const entry = STATE_FIELDS.find(e => e.event === type)
    if (entry) {
        // Write-through: if event carries the field, persist before deciding to emit
        if (data[entry.field] !== undefined) {
            this.data[entry.field] = data[entry.field]
        }
        const current = this.data[entry.field]
        const last = this.lastEmitted[entry.field]
        // Drop if value matches last emit (handles undefined === undefined too)
        if (entry.equal(current, last)) {
            return
        }
        this.lastEmitted[entry.field] = current
    }

    this.eventTargets.forEach((target, config) => {
        this.recordTargetEvent(target, config, type, data)
    })
    this.processEventTargets()
}
```

Events not in `STATE_FIELDS` (ERROR, TIME_INTERVAL, RESPONSE_RECEIVED, etc.) bypass dedup entirely.

The `equal` callbacks accept potentially-undefined values; scalar entries handle `undefined === undefined` correctly via `===`, and the `br` entry's wrapper handles it before delegating to `cmcdObjectTypeListEqual` (see the dispatch table above).

### `update` algorithm

`update()` gains an auto-trigger pass after the data merge. For each tracked field present in the incoming data whose value differs from its pre-merge value, fire the corresponding event:

```ts
update(data: Partial<Cmcd>): void {
    if (data.sid && data.sid !== this.data.sid) {
        this.resetSession()
    }
    if (data.msd && !isNaN(data.msd)) {
        this.msd = data.msd
    }

    const prev = this.data
    this.data = { ...prev, ...data, msd: undefined }

    // Auto-trigger state-change events for fields that changed
    for (const entry of STATE_FIELDS) {
        if (entry.field in data && !entry.equal(data[entry.field], prev[entry.field])) {
            this.recordEvent(entry.event)
        }
    }
}
```

`recordEvent` re-checks against `lastEmitted` and updates accordingly. If a player still calls `recordEvent(PLAY_STATE)` after `update({ sta })`, the second call is harmlessly deduped.

Multi-field updates fire multiple events. The iteration order is the dispatch table's declared order (sta → pr → cid → bg → br), making sequencing deterministic regardless of how the player ordered keys in the input.

### `resetSession`

Clears the dedup baseline so the new session always emits its first state-change events:

```ts
private resetSession(): void {
    this.eventTargets.forEach(target => target.sn = 0)
    this.requestTarget.sn = 0
    this.lastEmitted = {}
}
```

### Invariants

- A dropped event consumes no sequence number on any target. The early return in `recordEvent` happens before `recordTargetEvent` (which increments `target.sn`).
- A dropped event produces no queue side-effects.
- After `update({ field: X })` returns where `field` is a tracked state field: `this.data[field] === X`. If `X` differs from the pre-update value AND from `lastEmitted[field]`, the corresponding event has been emitted.
- After `recordEvent(event, { field: X })` returns where `field` is the dedup field for `event`: `this.data[field] === X` regardless of whether the event was emitted or dropped.
- After `update({ sid })`, `lastEmitted === {}`. The next state-change event with a defined effective value will emit.

### Edge case: missing dedup field

If `this.data[field]` is `undefined` at emission time, the state-change event is dropped. This applies in two scenarios:

1. **Never set:** `this.data[field]` was never populated (e.g., `recordEvent(PLAY_STATE)` called before any `sta` was set anywhere).
2. **Explicitly cleared:** the caller passed `{ field: undefined }` to `update()`, which overwrites the previous value via spread.

CMCD validators (`validateCmcdStructure.ts:114`) already flag state-change events without their required field as spec violations. Dropping at the source prevents malformed wire data, regardless of how the field became undefined.

## Public API impact

No new methods, no new types beyond `CmcdEventType.PLAYBACK_RATE`, no new config options. Three observable contract changes:

1. **Dedup.** Consecutive same-value state-change events no longer produce duplicate reports.
2. **Write-through.** `recordEvent(STATE_CHANGE_EVENT, { field })` now persists `field` into `this.data`.
3. **Auto-trigger.** `update({ field })` now fires the corresponding event when `field` is a tracked state field and its value changed.

All three align the implementation with CTA-5004-B intent.

## Documentation

Update `libs/cmcd/docs/user-guide.md`:

- Replace the two-step pattern around line 194 with the new recommended one-liner: `reporter.update({ sta: 'p' })`. State that this auto-fires `PLAY_STATE` when `sta` changes.
- Document the same auto-trigger for `pr`, `cid`, `bg`, `br`.
- Note that `recordEvent(<event>, { <field>, ...extra })` remains available for attaching extra context (e.g., `bl`, `pt`) at the moment of transition. Extra fields are ephemeral on the event; only the dedup field is write-through.
- Note that consecutive same-value calls (via either entry point) are deduped.

Update TSDoc on `update()` and `recordEvent()` to document dedup + auto-trigger.

## Tests

Add a `describe('state-change dedup', ...)` block in `libs/cmcd/test/CmcdReporter.test.ts`.

**Per-event dedup (run for each of the 5 events; parameterize over a fixture array or write out per event where shapes diverge):**

1. **First emit passes through.** Fresh reporter → `update({ field: value })` → 1 request.
2. **Consecutive same-value `update()` deduped.** Two `update({ field: value })` calls → 1 request.
3. **State transitions emit.** `update({ field: v1 })` then `update({ field: v2 })` → 2 requests.
4. **Mixed entry points dedup.** `update({ field: v })` then `recordEvent(event)` → 1 request.
5. **`recordEvent` write-through persists.** `recordEvent(event, { field: v })` then `createRequestReport(...)` → request includes the field.

**Cross-cutting:**

6. **Multi-field update fires multiple events in dispatch order.** `update({ pr: 1.5, sta: 'a' })` → 2 requests, PLAY_STATE first, PLAYBACK_RATE second (sta comes first in the table).
7. **Dropped event does not consume `sn`.** Emit PLAY_STATE (sn=0), drop a duplicate, then emit ERROR → ERROR carries `sn=1`.
8. **`sid` change resets dedup.** Emit PLAY_STATE with `sta='p'`, `update({ sid: 'new' })`, emit PLAY_STATE with `sta='p'` → 2 requests.
9. **Non-tracked events unaffected.** Two `recordEvent(ERROR)` calls → 2 requests.
10. **Missing field is dropped.** `recordEvent(PLAY_STATE)` with no `sta` anywhere → 0 requests.
11. **`update()` with non-tracked-only fields fires no event.** `update({ bl: [3000] })` → 0 requests.

**`br`-specific (equality helper):**

12. **Same content, different reference, deduped.** Two `update({ br: [5000] })` calls with separately constructed arrays → 1 request.
13. **SfItem with same value and params, deduped.** Two updates with structurally equal `SfItem(5000, { v: true })` → 1 request.
14. **SfItem with different params emits.** `[new SfItem(5000, { v: true })]` then `[new SfItem(5000, { a: true })]` → 2 requests.
15. **Order changes emit.** `[1000, 5000]` then `[5000, 1000]` → 2 requests (order-sensitive).
16. **Length change emits.** `[5000]` then `[5000, 1000]` → 2 requests.

## Risk

- **Behavior change visible to consumers.** Players relying on every `recordEvent` call producing a wire event will see fewer reports. This is the intended fix.
- **Auto-trigger from `update()`** is the largest behavior change. Players that call `update({ sta })` without intending to fire an event will now fire one. No realistic player benefits from setting tracked state without emitting — the persistent CMCD data reflects the new state, and the collector needs the transition marker. Worth a clear CHANGELOG line.
- **`br` equality is order-sensitive.** Players that shuffle `br` array order between updates will get spurious emits. Document; players should construct consistently.
- **Spec defines `pr` event but it was missing in code.** Prerequisite work adds `CmcdEventType.PLAYBACK_RATE`. Additive and low-risk.
- **Suggest minor version bump.** Auto-trigger and write-through are observable behavior additions beyond a strict bug fix.
