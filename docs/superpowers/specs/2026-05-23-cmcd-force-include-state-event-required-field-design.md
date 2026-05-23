# Force-Include State-Change Event Required Field

**Date:** 2026-05-23
**Issue:** [#368](https://github.com/streaming-video-technology-alliance/common-media-library/issues/368)
**Component:** `libs/cmcd/src/prepareCmcdData.ts`, `libs/cmcd/src/CmcdReporter.ts`
**Type:** Behavioral fix

## Problem

State-change event reports can be emitted without their required field when the encoder strips that field, producing payloads that violate CTA-5004-B. Per the spec, the five state-change events (`ps`, `pr`, `c`, `b`, `bc`) are state-transition markers and **must** carry the field whose value they signal. A report with `e=ps` and no `sta` is malformed; downstream collectors can't interpret it.

`prepareCmcdData` strips the required field in two distinct cases today:

### Case 1 — per-target `enabledKeys` filter

`prepareCmcdData` applies the user's `enabledKeys` filter, then force-includes a small set of post-filter required keys:

- `e` — if an event type is set
- `ts` — always in event mode
- `cen` — for `CUSTOM_EVENT`
- `v` — when version > 1

State-change required fields (`sta`, `pr`, `cid`, `bg`, `br`) are **not** force-included. If a target's `enabledKeys` omits the required field for a state-change event configured on that target, the encoder strips it and still emits the `e=...` token.

This was deferred during PR #367 ([comment thread](https://github.com/streaming-video-technology-alliance/common-media-library/pull/367#discussion_r3292029511), [pushback](https://github.com/streaming-video-technology-alliance/common-media-library/pull/367#discussion_r3292071819)). It isn't a regression from #367 — the same misconfiguration would have produced the same malformed report before that PR — but #367 added a partial "never emit without the required field" guarantee in the reporter, and per-target filtering is the remaining gap.

### Case 2 — `pr === 1` value-filter

`prepareCmcdData.ts` line 180:

```ts
// Playback rate should only be sent if not equal to 1.
if (key === 'pr' && value === 1) {
    continue
}
```

This is correct for request-mode reports (CMCD v1 guidance: omit default values) but wrong for event mode when `e === 'pr'`: the value IS the data being reported, even if it equals 1. Walkthrough:

1. Player at 1.5× speed. `update({ pr: 1.5 })` writes `pr` into `this.data`, auto-fires `e=pr` with `pr: 1.5`. Emits cleanly.
2. User resumes normal speed. `update({ pr: 1 })` writes `pr=1` into `this.data`. Reporter dedup baseline is 1.5 ≠ 1 → auto-fires `e=pr` with `pr: 1`.
3. Item reaches `prepareCmcdData` with `data = { e: 'pr', pr: 1, ts: ..., ... }`.
4. Line 180 strips `pr`. Wire emits `e=pr` with no `pr`. Malformed.

Same shape of bug, different root cause.

## Goals

1. Guarantee that `prepareCmcdData` never emits a state-change event token (`e=ps|pr|c|b|bc`) without the corresponding required field when the value is present in `data`.
2. Centralize the event-type → required-field mapping so it has one source of truth across the package.
3. Match the existing post-filter enforcement pattern for `e`/`ts`/`cen` — same shape, same guard style.

## Non-goals

- Validation in `validateCmcdEvents.ts` / `validateCmcdEventReport.ts`. Out of scope.
- Reporter-level changes (e.g., dropping state-change events when `enabledKeys` excludes the required field). Rejected in the issue: `enabledKeys` is the operator's "do not emit this key" contract — silently dropping events when an operator intentionally redacted a key (PII, payload size) is wrong behavior.
- Reordering the existing v1 `pr === 1` skip in request mode. That behavior is correct in request mode and stays.

## Design

### Shared mapping

A new module-scope file extracts the event-type → state-field mapping previously inlined in `CmcdReporter.ts`'s `STATE_FIELDS` table. Both `prepareCmcdData` and `CmcdReporter` import it.

**New file:** `libs/cmcd/src/CMCD_STATE_EVENT_FIELDS.ts`

```ts
import {
    CMCD_EVENT_BACKGROUNDED_MODE,
    CMCD_EVENT_BITRATE_CHANGE,
    CMCD_EVENT_CONTENT_ID,
    CMCD_EVENT_PLAY_STATE,
    CMCD_EVENT_PLAYBACK_RATE,
    type CmcdEventType,
} from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * Maps each state-change event type to the persistent field whose value
 * the event signals.
 *
 * Per CTA-5004-B, the state-change events `ps`, `pr`, `c`, `b`, `bc` are
 * state-transition markers and must carry the field whose value they signal.
 * Consumers force-include the field post-filter (`prepareCmcdData`) and dedup
 * against its value (`CmcdReporter`).
 *
 * @internal
 */
export const CMCD_STATE_EVENT_FIELDS: ReadonlyMap<CmcdEventType, CmcdKey> = new Map([
    [CMCD_EVENT_PLAY_STATE, 'sta'],
    [CMCD_EVENT_PLAYBACK_RATE, 'pr'],
    [CMCD_EVENT_CONTENT_ID, 'cid'],
    [CMCD_EVENT_BACKGROUNDED_MODE, 'bg'],
    [CMCD_EVENT_BITRATE_CHANGE, 'br'],
])
```

`ReadonlyMap<CmcdEventType, CmcdKey>` matches the existing `STATE_FIELDS_BY_EVENT` pattern in `CmcdReporter.ts` and gives `CmcdKey | undefined` from `.get()` — no casts at consumer sites. The name `CMCD_STATE_EVENT_FIELDS` is semantically neutral so each consumer can frame the mapping in its own local terms.

### `prepareCmcdData` — Case 1 fix

Extend the existing `if (isEventMode)` post-filter enforcement block. After the `cen` enforcement, add:

```ts
const requiredField = eventType ? CMCD_STATE_EVENT_FIELDS.get(eventType) : undefined
if (requiredField && data[requiredField] != null && !keys.includes(requiredField)) {
    keys.push(requiredField)
}
```

The `data[requiredField] != null` guard preserves the reporter's existing short-circuit (PR #367 drops state-change events with `undefined` everywhere before the encoder is invoked). For direct callers of `prepareCmcdData`, the guard prevents synthesizing an empty key with no value.

The local variable name is `requiredField`, not `dedupField`. Dedup is a reporter concept; here the field is "the field required to be present given this event type". Reads naturally alongside the `e`/`ts`/`cen` force-includes that all share the same theme.

### `prepareCmcdData` — Case 2 fix

Gate the `pr === 1` value-skip on the event type:

```ts
// Playback rate should only be sent if not equal to 1, except as the value
// of a PLAYBACK_RATE state-change event.
if (key === 'pr' && value === 1 && data['e'] !== CMCD_EVENT_PLAYBACK_RATE) {
    continue
}
```

The `data['e'] !== CMCD_EVENT_PLAYBACK_RATE` check is safe in request mode (where `e` is typically unset). Anyone relying on getting `e=pr` events with no `pr` value was depending on a spec-non-compliant payload.

Requires adding `CMCD_EVENT_PLAYBACK_RATE` to the existing `CmcdEventType` import in `prepareCmcdData.ts`.

### `CmcdReporter` refactor

`STATE_FIELDS` no longer hardcodes `field` strings; it derives from the shared mapping via `Array.from`, supplying the dedup-specific `equal`/`snapshot` per entry:

```ts
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'

const STATE_FIELDS: readonly StateFieldEntry[] = Array.from(
    CMCD_STATE_EVENT_FIELDS,
    ([event, field]) => {
        if (field === 'br') {
            return {
                event,
                field,
                equal: (a, b) => (a === undefined || b === undefined) ? a === b : cmcdObjectTypeListEqual(a as CmcdObjectTypeList, b as CmcdObjectTypeList),
                snapshot: (v) => (v as CmcdObjectTypeList).slice(),
            }
        }
        return { event, field: field as StateField, equal, snapshot: identity }
    },
)
```

The `StateField` type stays reporter-internal. Adding a 6th state-change event in the future is a one-line change in `CMCD_STATE_EVENT_FIELDS`, plus a comparator clause in the `STATE_FIELDS` builder if it needs custom equality (default `Object.is` covers scalars).

`STATE_FIELDS_BY_EVENT` remains unchanged — it's still built from `STATE_FIELDS`.

### Data flow

```
recordTargetEvent → queues { e, ts, sn, ...this.data, ...data }
                          ↓
processEventTargets → sendEventReport
                          ↓
encodeCmcd(item, options)  // options.filter = key => target.enabledKeys.has(key)
                          ↓
prepareCmcdData(item, options)
   filter via filterMap[EVENT]            → keep CMCD event keys
   filter via options.filter              → drop keys not in enabledKeys
   force-include e (if eventType)
   force-include ts (always in event mode)
   force-include cen (if e=ce)
   force-include requiredField (NEW)      → if eventType maps to a required field
                                            and data[requiredField] != null
   skip pr if value === 1 (UNLESS e=pr)   → MODIFIED
   sort, format, return Cmcd
```

### Edge cases

- **`RESPONSE_RECEIVED` (`e=rr`)** — not in `CMCD_STATE_EVENT_FIELDS`; unchanged.
- **Non-state events** (`TIME_INTERVAL`, `MUTE`, `PLAYER_EXPAND`, ad-lifecycle, etc.) — not in the map; unchanged.
- **`CUSTOM_EVENT` (`e=ce`)** — not in the map; existing `cen` enforcement (separate branch) still applies.
- **Event mode but `data['e']` is unset** — `eventType` is `undefined`, `.get(undefined)` returns `undefined`, no force-include.
- **Request mode** — entire force-include block is guarded by `if (isEventMode)`; no change to request-mode behavior.
- **`pr === 1` in request mode** — `data['e']` is unset, skip still applies. v1 default-omission preserved.
- **`pr === 1` in non-`e=pr` event** (e.g., `e=rr` with persistent `pr: 1` in `this.data`) — skip still applies. Only `e=pr` keeps the `pr` value.
- **Required field present in `data` but value is `null`** — `data[requiredField] != null` guard skips force-include. Caller bug, not the encoder's responsibility to synthesize.

## Testing

Tests added to `libs/cmcd/test/encodeCmcd.test.ts`, in the existing `describe('filtering', ...)` block (around line 42), follow the same pattern as the existing `e`/`ts`/`cen` filter tests.

### Required field force-include — one positive test per state event

```ts
it('doesn\'t filter sta key in event mode when event type is ps', ...)
it('doesn\'t filter pr key in event mode when event type is pr', ...)
it('doesn\'t filter cid key in event mode when event type is c', ...)
it('doesn\'t filter bg key in event mode when event type is b', ...)
it('doesn\'t filter br key in event mode when event type is bc', ...)
```

Each uses `reportingMode: EVENT`, `filter: key => key === 'cid'` (or similar restrictive filter), and asserts the required field appears in the output.

### Negative tests

```ts
it('doesn\'t force-include sta when value is null/undefined')
it('doesn\'t affect non-state events (rr)')
it('doesn\'t force-include required field in request mode')
```

### `pr === 1` value-filter

```ts
it('preserves pr=1 in event mode when event type is pr')
it('still skips pr=1 in request mode')
it('still skips pr=1 in non-pr event mode (e.g. rr)')
```

### Coverage matrix summary

| Event | required field force-include test | enabledKeys excludes field | data value absent |
|-------|------|------|------|
| `ps`  | ✓ | ✓ (via filter) | ✓ |
| `pr`  | ✓ | ✓ | ✓ + value=1 case |
| `c`   | ✓ | ✓ | ✓ |
| `b`   | ✓ | ✓ | ✓ |
| `bc`  | ✓ | ✓ | ✓ |
| `rr`  | (no-op) | n/a | n/a |

## Backward compatibility

Strictly additive at the encoder. Existing callers of `prepareCmcdData` see no behavior change unless they were producing malformed (spec-non-compliant) state-change events, in which case the malformation goes away. The `pr === 1` change is also a strict improvement — anyone receiving `e=pr` with no `pr` value was getting a malformed report.

The `CmcdReporter` refactor is internal (no public API change); `STATE_FIELDS` is module-private.

## References

- [Issue #368](https://github.com/streaming-video-technology-alliance/common-media-library/issues/368)
- [PR #367 — state-change event dedup + auto-trigger](https://github.com/streaming-video-technology-alliance/common-media-library/pull/367)
- [CTA-5004-B state-change event definitions](https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html)
- Encoder: `libs/cmcd/src/prepareCmcdData.ts`
- Dispatch table: `libs/cmcd/src/CmcdReporter.ts` (`STATE_FIELDS`)
