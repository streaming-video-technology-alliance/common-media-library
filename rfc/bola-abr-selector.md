---
status: draft
---

# RFC: BOLA bitrate selector (`@svta/cml-abr`)

| | |
|---|---|
| **Author** | Nicolas Caballero |
| **Date** | 2026-10-05 |
| **Package** | `@svta/cml-abr` (new) |
| **Breaking change** | No (new package) |

## Summary

This RFC proposes a new package, `@svta/cml-abr`. It ships `BolaSelector`, an implementation of BOLA (Buffer Occupancy based Lyapunov Algorithm). BOLA is an adaptive bitrate (ABR) algorithm. It picks one rung from a bitrate ladder, and its main input is the buffer level.

The caller passes the throughput estimate as a plain number. Any `ThroughputEstimator` from `@svta/cml-throughput` can produce it. BOLA does not measure throughput.

Issue 358 asked to add BOLA to `@svta/cml-throughput`. BOLA does not fit that package. This RFC asks the maintainers to confirm the new package. See Rationale and alternatives.

```ts
import { BolaSelector } from '@svta/cml-abr'

const selector = new BolaSelector()
const ladderBps = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000]

const { index } = selector.select({ ladderBps, bufferLevelS: 0, throughputBps: 2_000_000, nowMs: 0 })
// index is 2. At startup the selector picks the highest rung at or below 0.9 * 2 Mbps.
```

## Motivation

A player picks a rung before every segment request. Most players estimate the throughput from past downloads and pick the rung that fits. The estimate is noisy and lags behind drops. The quality oscillates when the estimate sits between two rungs. hls.js and shaka-player select rungs this way.

BOLA decides from the buffer level. A full buffer allows a high rung. A low buffer forces a low rung. It needs no accurate throughput estimate and it switches less often. dash.js ships BOLA.

CML has throughput estimators but no code that turns a measurement into a rung. A shared implementation gives every player the same tested algorithm. The [analysis](../plans/bola-abr/analysis.md) explains BOLA and lists the benefits and the costs.

Feedback from a dash.js maintainer on the original proposal shaped this design:

- Throughput calculation and ABR algorithms must stay separate. BOLA still needs a throughput estimate at startup and after a seek.
- The number of switchable rungs can change during playback. Multi-period streams change it. A new minimum or maximum bitrate changes it. A resized video element changes it. The design must say what BOLA does in each case.

## Guide-level explanation

An adopter creates one selector for each media type. The adopter calls `select` before every segment request. The adopter reports every finished segment with `onSegmentLoaded`.

```ts
import { BolaSelector } from '@svta/cml-abr'
import { HarmonicMeanEstimator } from '@svta/cml-throughput'

const ladderBps = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000]
const estimator = new HarmonicMeanEstimator()
const selector = new BolaSelector()

// First request. No sample exists, so the estimate is NaN and the selector picks rung 0.
const first = selector.select({ ladderBps, bufferLevelS: 0, throughputBps: estimator.getEstimate(), nowMs: 0 })

// The player downloads a 4 second segment of rung 0 in 400 ms.
estimator.sample({ startTime: 0, encodedBodySize: 150_000, duration: 400 })
selector.onSegmentLoaded({ durationS: 4, bitrateBps: ladderBps[first.index], requestStartMs: 0, requestEndMs: 400, bufferLevelS: 0 })

// Second request. The estimate is 3 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladderBps, bufferLevelS: 4, throughputBps: estimator.getEstimate(), nowMs: 400 })
```

The adopter follows these rules:

- `index` is a position in the `ladderBps` array of the same call.
- `delayS` is the time in seconds to wait before the next request. The value is `0` most of the time.
- Pass `ladderBps` and `bufferLevelS` in every call. The selector compares the ladder with its last copy and adapts when it changed. See Ladder changes.
- Call `reset` after a seek or a source change. The selector returns to the startup state.
- Call `onBufferEmpty` when playback stalls.
- Call `onSegmentLoaded` for every segment. A selector that never receives it stays in the startup state.

## Reference-level explanation

### Algorithm

Let `b_0 ... b_(M-1)` be the distinct rungs in ascending order, in bits per second. The selector derives these values from the ladder and the buffer target:

```
v_i   = ln(b_i / b_0)
B     = max(bufferTargetS, 10 + 2 * M)
V     = (B - 10) / v_(M-1)
gamma = 10 / V
```

The values 10 seconds and 2 seconds per rung come from dash.js. For an effective buffer `Q` in seconds, BOLA scores each rung and picks the best score:

```
score_i(Q) = (V * (v_i + gamma) - Q) / b_i
```

A tie goes to the higher rung. The selector does not evaluate scores at run time. It precomputes one threshold for each rung and picks the highest rung with a threshold at or below `Q`:

```
threshold_0 = 0
threshold_i = max(0, V * (gamma + (b_i * v_(i-1) - b_(i-1) * v_i) / (b_i - b_(i-1))))
```

A unit test compares these thresholds with a direct search of the score function. The score of rung `i` reaches zero at `V * (v_i + gamma)`. This level is the maximum buffer of the rung.

### Export surface

All types use `type`. The state uses the repo const enum pattern. Units are bits per second and seconds.

```ts
export const BolaState = { STARTUP: 'startup', STEADY: 'steady' } as const
export type BolaState = ValueOf<typeof BolaState>

export type BolaSelectInput = {
	ladderBps: readonly number[]   // ascending, already filtered by the caller
	bufferLevelS: number
	throughputBps: number          // raw estimate, NaN when unknown
	nowMs: number                  // same clock as the segment events
	bufferTargetS?: number         // @defaultValue BOLA_DEFAULT_BUFFER_TARGET_S
}

export type BolaDecision = {
	readonly index: number         // position in ladderBps of the same call
	readonly delayS: number        // wait before the next request, 0 or more
	readonly state: BolaState
	readonly placeholderS: number
}

export type BolaSegmentLoadedEvent = {
	durationS: number
	bitrateBps: number
	requestStartMs: number
	requestEndMs: number
	bufferLevelS: number           // at requestEndMs, before the segment is appended
	isReplacement?: boolean
}

export type BolaSelectorOptions = {
	throughputSafetyFactor?: number   // @defaultValue BOLA_DEFAULT_THROUGHPUT_SAFETY_FACTOR
}

export class BolaSelector {
	public constructor(options?: BolaSelectorOptions)
	public select(input: BolaSelectInput): BolaDecision
	public onSegmentLoaded(event: BolaSegmentLoadedEvent): void
	public onBufferEmpty(): void
	public onAbandon(bufferLevelS: number): void
	public reset(): void
}
```

The package also exports two constants: `BOLA_DEFAULT_BUFFER_TARGET_S` (18) and `BOLA_DEFAULT_THROUGHPUT_SAFETY_FACTOR` (0.9). The threshold functions, the ladder validation, and the other helpers stay internal. The selector never imports `@svta/cml-throughput`.

### State machine and events

The selector keeps a placeholder buffer. This is virtual buffer time that the selector adds to the real buffer level. The effective buffer `Q` is the sum of both. The placeholder lets startup and seeks begin at a sustainable rung instead of the lowest rung.

| Input | Effect |
|---|---|
| `select`, startup state | Picks the highest rung at or below `throughputBps * throughputSafetyFactor`. Picks rung 0 when the estimate is unknown. Sets the placeholder so that `Q` equals the threshold of that rung. Moves to the steady state when a segment was loaded and the buffer holds at least one segment. |
| `select`, steady state | Adds the wall-clock time since the last segment ended to the placeholder. If no segment ended, it uses the time since the last call. Picks the rung for `Q`. Applies the oscillation guard. Computes the delay. |
| `onSegmentLoaded` | Records the loaded rung as the current rung. Multiplies the placeholder by 0.99. Caps it so that the effective buffer at request time stays at or below the maximum buffer of that rung. Adds `durationS` when `isReplacement` is true. |
| `onBufferEmpty` | In the steady state, sets the placeholder to 0. |
| `onAbandon` | Caps the placeholder at the threshold of the current rung, or at 10 seconds for rung 0. |
| `reset` | Returns to the startup state and clears all history. |

The oscillation guard is the BOLA-O variant. Suppose the score picks a rung above both the current rung and the rung that the throughput sustains. Then the selector keeps the higher of the current rung and the sustained rung. The guard is skipped when the estimate is unknown.

The delay is `max(0, Q - maximumBuffer(rung))`. The selector drains the placeholder first. The remainder becomes `delayS`. At the top rung the delay is always 0.

### Ladder changes

The selector compares `ladderBps` and `bufferTargetS` with its stored copies in every `select` call. The comparison is O(N), allocates nothing, and detects in-place changes. A change rebuilds the derived values. The rebuild is the only step that validates the input.

The selector stores the current rung as a bitrate, not as an index. After a rebuild it maps the bitrate to the highest new rung at or below it.

In the steady state, the rebuild keeps the effective buffer equivalent. Each switch point depends only on the two neighbouring bitrates. The selector converts `Q` to a quantity that does not depend on the ladder and converts it back:

```
theta        = (Q_old - 10) / V_old + ln(b_0_old)
Q_new        = 10 + V_new * (theta - ln(b_0_new))
placeholder  = max(0, Q_new - bufferLevelS)
```

| Event | Selector behavior |
|---|---|
| The number of rungs changes (multi-period, MPD update) | Rebuild and apply the conversion in the steady state. |
| The caller changes the minimum or maximum bitrate, or the video size | The caller filters the ladder. This is the same case as the previous row. |
| `bufferTargetS` changes | Rebuild and apply the conversion. The decision for the same buffer level stays the same. |
| Seek or new source | The caller calls `reset`. |
| The ladder gains or loses its second distinct rung | Return to the startup state. |

The [design record](../plans/bola-abr/design.md) has the measured effect of the conversion on each case.

### Input validation

Validation runs only on a rebuild. It throws a `RangeError` before it changes any state. The message names the parameter, the expected value, and the received value.

| Input | Behavior |
|---|---|
| `ladderBps` empty, or an entry that is not a positive finite number | Throws. |
| `ladderBps` not in ascending order | Throws. The result index refers to the caller array, so the selector cannot sort it. |
| Equal neighbouring rungs | Accepted. They merge, and the highest index wins. |
| `bufferTargetS` not a positive finite number | Throws. |
| `bufferTargetS` below `10 + 2 * M` | Raised to `10 + 2 * M`. |
| `bufferLevelS` not finite or negative | Treated as 0. |
| `throughputBps` not a positive finite number | Treated as unknown. |

### Differences from dash.js

The selector follows `BolaRule.js` in dash.js, with these deliberate changes:

- The minimum and maximum buffer helpers use the same utility offset as the score. The dash.js helpers differ from the score by `V` seconds.
- The selector reads the ladder in every call and handles in-place ladder changes. dash.js builds its state once for each stream and media type.
- The selector indexes everything by position in the caller ladder. dash.js mixes positions in a filtered list with indices in an unfiltered list.
- An unknown throughput does not block upward switches in the steady state.
- A stall clears the time bases of the placeholder.
- The caller injects the time. dash.js reads `Date.now()`.

### Bundle and performance impact

Each file holds one export or one internal function, so bundlers drop unused code. The `select` call compares the ladder in O(N), scans thresholds in O(M), and allocates only the returned decision. A call without a ladder change does not call `Math.log`. The implementation PR will report the minified size.

### Testing

The [steps](../plans/bola-abr/steps.md) list the full strategy. In short:

- Unit and property tests for the threshold math, with an independent score-based oracle.
- State machine tests for every input in the events table.
- One test for each row of the ladder change table.
- A seeded playback simulation that compares the selector with a rate-based baseline.
- A manual comparison with the dash.js `BolaRule` on the same ladder and buffer inputs.

### Packaging

The scaffold follows `libs/error-codes`. The version starts at 0.0.1. The only peer dependency is `@svta/cml-utils`, imported with `import type` for `ValueOf`. The root build script includes the package. `scripts/projects.ts` does not list it until the first release-prep PR. The package ships a `NOTICE.md` with the dash.js attribution.

## Drawbacks

- A new package adds release work. The first publish needs the manual steps from `AGENTS.md`.
- The selector owns state. A caller that forgets `onSegmentLoaded` keeps the selector in the startup state.
- BOLA alone suits large buffers. A small buffer target needs a rate-based rule at low buffer levels. The caller must combine the two.
- BOLA still stalls in the simplified simulation, and a real-buffer guard reduces the stalls. The selector does not include the guard in v1. See the [analysis](../plans/bola-abr/analysis.md).
- The behavior can drift from dash.js. The list of deliberate differences and the manual comparison limit that risk.

## Rationale and alternatives

- **A new package `@svta/cml-abr`** (chosen). It separates measurement from decision, as the maintainer feedback asks. It is the natural home for other selection algorithms. Adopters of `@svta/cml-throughput` receive no ABR code.
- **A class inside `@svta/cml-throughput`.** This is what the issue title says. It needs no new package. It mixes two concerns in one package, and BOLA could not implement `ThroughputEstimator`.
- **Extend `ThroughputEstimator` with buffer inputs.** This breaks the contract of the four existing estimators. It adds inputs that no estimator needs.
- **Omit the placeholder buffer and the oscillation guard.** This gives plain BOLA. The analysis shows that it starts slowly and reaches the top rungs late or never when the player buffer cap is below `B`.
- **Add a common `BitrateSelector` type now.** BOLA is the only implementation. Its inputs would shape the type. The type can be added later without a breaking change.

## Prior art

- [dash.js `BolaRule.js`](https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/BolaRule.js) is the reference implementation. It is tied to the dash.js event system and settings.
- [BOLA: Near-Optimal Bitrate Adaptation for Online Videos](https://arxiv.org/abs/1601.06748) defines the algorithm and its variants.
- dash.js combines BOLA with a throughput rule. It uses the throughput rule at low buffer levels and BOLA at high buffer levels.
- hls.js and shaka-player select rungs with exponentially weighted throughput estimates. Neither ships BOLA.

## Unresolved questions

1. **Real-buffer guard.** dash.js pairs BOLA with a separate rule that blocks high rungs when the real buffer is small. Should the selector offer this as an option, or should callers own it?
2. **Optional placeholder buffer.** In the simplified simulation, the placeholder is required when the player buffer cap is below `B`. At or above `B`, it adds a small bitrate gain and some stalls. Should the placeholder be an option?
3. **Dense ladders.** The `10 + 2 * M` rule gives a large `B` for ladders with many rungs. Take a test ladder of 20 rungs from 300 kbps to 6 Mbps with equal bitrate ratios. The buffer rule never selects its two lowest rungs. Should the 2 seconds per rung become an option?
4. **Small buffer targets.** In the dash.js follow-up paper, a throughput rule oscillates less than BOLA with a 10 second buffer, for example in low-latency streams. Should the selector warn, or only document the limit?
5. **Paused playback.** The placeholder grows with wall-clock time. A paused player also adds time. Should `select` accept a `paused` flag?
6. **Multi-period streams.** The caller passes the ladder of the period of the next segment. Do the maintainers agree with this rule?
7. **Media types.** The design uses one selector for each media type. Should the documentation state this, or should one selector handle both?
8. **Abandon.** `onAbandon` has no abandon-decision rule behind it. Should v1 keep it?
9. **Hybrid selector and common type.** Both are out of scope for v1. Do the maintainers want the common type earlier?
10. **Placement and issue title.** Do the maintainers prefer a new package or `@svta/cml-throughput`? The title of issue 358 says "estimator". Should it change?

## Future possibilities

- A hybrid selector that uses a rate-based rule at low buffer levels and BOLA at high buffer levels.
- A common `BitrateSelector` type, once a second algorithm exists.
- A real-buffer guard option, depending on the answer to question 1.
- Public pure functions for players that keep their own state.

## Revision history

- v1 (2026-10-05): initial draft.

## Final Decision

Pending maintainer review.
