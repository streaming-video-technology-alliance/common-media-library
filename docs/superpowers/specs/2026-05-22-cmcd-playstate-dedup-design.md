# CMCD PLAY_STATE Deduplication Design

**Date:** 2026-05-22
**Component:** `libs/cmcd/src/CmcdReporter.ts`
**Type:** Behavioral fix

## Problem

`CmcdReporter.recordEvent(CmcdEventType.PLAY_STATE, ...)` enqueues and reports a `ps` event on every call, regardless of whether the player's state actually changed. The CTA-5004-B spec defines `ps` as a state *change* event — duplicates are noise, not data.

A secondary asymmetry compounds the problem: `sta` is "persistent data" when set via `update({ sta })`, but ephemeral when passed to `recordEvent(PLAY_STATE, { sta })`. The two entry points disagree about what `this.data.sta` should be after they return.

## Goals

1. Suppress consecutive `PLAY_STATE` events that carry the same effective `sta`.
2. Make `recordEvent(PLAY_STATE, { sta })` and `update({ sta })` agree on the persistent `sta` value.
3. No new public API surface, no config flag.

## Non-goals

- Dedup for other event types (ERROR, MUTE, etc.). PLAY_STATE only.
- Auto-firing `PLAY_STATE` when `update({ sta })` changes the value. `update()` stays a silent persistent-data setter.
- Tracking state per event target. Dedup is reporter-wide.

## Design

### State model

`this.data.sta` is the single source of truth for the player's current state. Both entry points respect it:

| Entry point | Effect on `this.data.sta` | Emits event |
|---|---|---|
| `update({ sta: 'p' })` | Sets to `'p'` | No |
| `recordEvent(PLAY_STATE)` (no `sta` in data) | No change | Maybe (subject to dedup) |
| `recordEvent(PLAY_STATE, { sta: 'p' })` | Sets to `'p'` (write-through) | Maybe (subject to dedup) |

### Dedup field

A new private instance field on `CmcdReporter`:

```ts
private lastEmittedSta: CmcdPlayerState | undefined
```

This tracks the `sta` value of the most recently *emitted* PLAY_STATE event. It is intentionally separate from `this.data.sta`, because `update({ sta })` can change `this.data.sta` silently and the dedup baseline must reflect what was last reported on the wire, not what's currently in persistent data.

### Algorithm

`recordEvent` gains a PLAY_STATE-specific preamble:

```ts
recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
    if (type === CmcdEventType.PLAY_STATE) {
        // Write-through: persist sta before deciding to emit
        if (data.sta !== undefined) {
            this.data.sta = data.sta
        }
        // Drop if state has not changed since last emitted PLAY_STATE
        if (this.data.sta === this.lastEmittedSta) {
            return
        }
        this.lastEmittedSta = this.data.sta
    }

    this.eventTargets.forEach((target, config) => {
        this.recordTargetEvent(target, config, type, data)
    })
    this.processEventTargets()
}
```

`resetSession` clears `lastEmittedSta` so a new session always emits its first PLAY_STATE:

```ts
private resetSession(): void {
    this.eventTargets.forEach(target => target.sn = 0)
    this.requestTarget.sn = 0
    this.lastEmittedSta = undefined
}
```

### Invariants

- A dropped PLAY_STATE consumes no sequence number on any target. The early return happens before `recordTargetEvent` (which is where `target.sn++` lives).
- A dropped PLAY_STATE produces no queue side-effects. Targets see only emitted events.
- After `recordEvent(PLAY_STATE, { sta: X })` returns, `this.data.sta === X` regardless of whether the event was emitted or dropped.
- After `update({ sta: X })` returns, `this.data.sta === X` and `lastEmittedSta` is unchanged.
- After a `sid` change via `update({ sid })`, `lastEmittedSta === undefined`. The next PLAY_STATE with a defined effective `sta` will emit (undefined effective `sta` is still dropped — see edge case below).

### Edge case: PLAY_STATE with no `sta`

If neither `data.sta` nor `this.data.sta` is defined when `recordEvent(PLAY_STATE)` is called, the comparison `this.data.sta === this.lastEmittedSta` evaluates `undefined === undefined` → `true`, and the event is dropped.

This is a deliberate behavior change. Today such events are sent to the collector despite being malformed (`validateCmcdStructure.ts:114` already flags `e=ps` without `sta` as a spec violation). Under this design they are dropped at the source, which is the more correct behavior.

## Public API impact

No new methods, no new types, no new config options. Two observable behavioral contract changes:

1. **Dedup.** Consecutive same-`sta` `recordEvent(PLAY_STATE)` calls no longer produce duplicate event reports.
2. **Write-through.** `recordEvent(PLAY_STATE, { sta })` now persists `sta` into `this.data`, affecting subsequent `createRequestReport` output. Previously the value appeared only on that one event report.

Both align the implementation with CTA-5004-B intent.

## Documentation

Update `libs/cmcd/docs/user-guide.md` around the play-state example (line 194):

- Keep the documented two-step pattern (`update({ sta }) + recordEvent(PLAY_STATE)`) as the recommended form.
- Add a note that `recordEvent(PLAY_STATE, { sta })` is equivalent — both persist `sta` and gate emission on state change.
- Note that consecutive same-state calls are deduped.

Update the TSDoc on `recordEvent` to call out PLAY_STATE-specific behavior (dedup + write-through).

## Tests

New `describe('PLAY_STATE dedup', ...)` block in `libs/cmcd/test/CmcdReporter.test.ts`:

1. **First emit passes through.** Fresh reporter → `update({sta:'p'}); recordEvent(PLAY_STATE)` → 1 request.
2. **Consecutive same-`sta` deduped.** Two PLAY_STATE calls with `sta='p'` → 1 request.
3. **State transitions emit.** PLAY_STATE with `sta='p'` then `sta='a'` → 2 requests; second body contains `sta=a`.
4. **Write-through persists.** `recordEvent(PLAY_STATE, {sta:'p'})` then `createRequestReport(...)` → request includes `sta=p`.
5. **Mixed entry points dedup.** `update({sta:'p'}); recordEvent(PLAY_STATE)` then `recordEvent(PLAY_STATE, {sta:'p'})` → 1 request.
6. **`update({sta})` alone is silent.** `update({sta:'p'})` with no follow-up → 0 requests.
7. **`update` change followed by emit.** `update({sta:'p'}); recordEvent(PLAY_STATE); update({sta:'a'}); recordEvent(PLAY_STATE)` → 2 requests.
8. **Dropped event does not consume `sn`.** Emit PLAY_STATE (sn=0), drop a duplicate, then emit ERROR → ERROR carries `sn=1`.
9. **`sid` change resets dedup.** Emit PLAY_STATE with `sta='p'`, `update({sid:'new'})`, emit PLAY_STATE with `sta='p'` → 2 requests.
10. **Other event types unaffected.** Two `recordEvent(ERROR)` calls → 2 requests.
11. **Missing `sta` is dropped.** `recordEvent(PLAY_STATE)` with no `sta` anywhere → 0 requests.

## Risk

- **Behavior change visible to consumers.** Players currently relying on every `recordEvent(PLAY_STATE)` call producing a wire event will see fewer reports. This is the intended fix but worth a clear CHANGELOG line.
- **Write-through is a semantic change.** Players that called `recordEvent(PLAY_STATE, { sta })` and then *separately* set `sta` via `update()` will now see the recordEvent path also persist. No realistic player should be doing that, but worth flagging.
- **Suggest patch or minor version bump.** Closer to a bug fix than a feature.
