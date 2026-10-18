---
status: draft
---

# RFC: BOLA bitrate selector (`@svta/cml-abr`)

| | |
|---|---|
| **Author** | Nicolas Caballero |
| **Date** | 2026-10-05 (revised 2026-10-18) |
| **Package** | `@svta/cml-abr` |
| **Breaking change** | No (new exports) |

## Summary

This RFC proposes `createBolaSelector`, the second selector of `@svta/cml-abr`. It implements the `BitrateSelector` type of the [bitrate selector RFC](../bitrate-selector.md) with BOLA (Buffer Occupancy based Lyapunov Algorithm). BOLA picks one rung from a bitrate ladder, and its main input is the buffer level.

The player passes the throughput estimate in `throughput`, as for every selector. BOLA uses it at startup and as a cap on upward switches. BOLA does not measure throughput.

```ts
import { createBolaSelector } from '@svta/cml-abr'

const selector = createBolaSelector()
const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }]

const { index } = selector.select({ ladder, bufferLevel: 0, throughput: 2_000_000, now: 0 })
// index is 2. At startup the selector picks the highest rung at or below 0.9 * 2 Mbps.
```

## Motivation

A player picks a rung before every segment request. The throughput selector of `@svta/cml-abr` picks the rung that the throughput estimate sustains. The estimate is noisy and lags behind drops. The quality oscillates when the estimate sits between two rungs. hls.js and shaka-player select rungs this way.

BOLA decides from the buffer level. A full buffer allows a high rung. A low buffer forces a low rung. It needs no accurate throughput estimate and it switches less often. The dash.js player ships BOLA and runs it above a buffer level, with the throughput rule below that level.

A shared implementation gives every player the same tested algorithm, behind the same type as the throughput selector. The [analysis](./analysis.md) explains BOLA and lists the benefits and the costs.

Feedback from a dash.js maintainer on the original proposal shaped this design:

- Throughput calculation and ABR algorithms must stay separate. The `BitrateSelector` type keeps them separate: the player passes an estimate, and BOLA still needs it at startup and after a seek.
- The number of switchable rungs can change during playback. Multi-period streams change it. A new minimum or maximum bitrate changes it. A resized video element changes it. The design says what BOLA does in each case.

## Guide-level explanation

A player creates one estimator and one selector for each media type. The player calls `select` before every segment request and `sample` after every finished download, with the same timing object it gave the estimator. The [bitrate selector RFC](../bitrate-selector.md) defines these calls, the input, the sample, and the player rules. This section lists only what BOLA adds.

```ts
import { createBolaSelector } from '@svta/cml-abr'
import { EwmaEstimator } from '@svta/cml-throughput'

const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }]
const estimator = new EwmaEstimator({ fastHalfLife: 3, slowHalfLife: 9 })
const selector = createBolaSelector()

// First request. No sample exists, the estimate is NaN, and the selector picks rung 0.
const first = selector.select({ ladder, bufferLevel: 0, throughput: estimator.getEstimate(), now: 0 })

// The player downloads a 4 second segment of rung 0 (150,000 bytes) in 400 ms, at 3 Mbps.
const timing = { startTime: 0, encodedBodySize: 150_000, duration: 400 }
estimator.sample(timing)
selector.sample({ timing, bandwidth: ladder[first.index].bandwidth, duration: 4, bufferLevel: 0 })

// Second request. The estimate is 3 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladder, bufferLevel: 4, throughput: estimator.getEstimate(), now: 400 })
```

What BOLA adds to the shared rules:

- `delay` is positive when the buffer is above the maximum level of the chosen rung. After the wait, call `select` again. The selector adds the wait to its placeholder buffer, and the second call returns a delay of 0. A player that ignores the delay fills the buffer with the selected rung until the real buffer passes the next threshold. The cost is lower quality, not a stall.
- `bufferTarget` sets the buffer level at which BOLA reaches the top rung. The default is `BOLA_DEFAULT_BUFFER_TARGET`. Pass the field in every call or in none.
- A stall needs no call. The selector derives it from `bufferLevel`. See Stalls.
- `reset` returns the selector to the startup state. Call it after a seek or a source change.
- A selector that never receives a `sample` stays in the startup state.

## Reference-level explanation

### Algorithm

Let `b_0 ... b_(M-1)` be the distinct bandwidths in ascending order, in bits per second. The selector derives these values from the ladder and the buffer target:

```
v_i   = ln(b_i / b_0)
B     = max(bufferTarget, 10 + 2 * M)
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

The selector implements `BitrateSelector` and reads `ladder`, `bufferLevel`, `throughput`, `now`, and `bufferTarget` from the input. It ignores `segmentDuration` and `playbackRate`. The state uses the repo const enum pattern. Units are bits per second and seconds, stated in the TSDoc.

```ts
export const BolaState = { STARTUP: 'startup', STEADY: 'steady' } as const
export type BolaState = ValueOf<typeof BolaState>

export type BolaDecision = BitrateDecision & {
	readonly state: BolaState
	readonly placeholder: number    // seconds of virtual buffer in the decision
}

export type BolaSelector = BitrateSelector & {
	select(input: BitrateSelectorInput): BolaDecision
}

export type BolaSelectorOptions = {
	safetyFactor?: number           // @defaultValue DEFAULT_SAFETY_FACTOR
}

export function createBolaSelector(options?: BolaSelectorOptions): BolaSelector
```

The package also exports `BOLA_DEFAULT_BUFFER_TARGET` (18 seconds). `safetyFactor` has the meaning and the bounds of the throughput selector option with the same name, and `DEFAULT_SAFETY_FACTOR` is its default. The threshold functions, the ladder validation, and the other helpers stay internal.

### State machine

The selector keeps a placeholder buffer. This is virtual buffer time that the selector adds to the real buffer level. The effective buffer `Q` is the sum of both. The placeholder lets startup and seeks begin at a sustainable rung instead of the lowest rung. The time bases of the placeholder come from the sample: the request end is `timing.startTime + timing.duration`.

| Input | Effect |
|---|---|
| `select`, startup state | Picks the highest rung at or below `throughput * safetyFactor`. Picks rung 0 when the estimate is unknown. Sets the placeholder so that `Q` equals the threshold of that rung. Moves to the steady state when a segment was sampled and the buffer holds at least one segment. |
| `select`, steady state | Adds the wall-clock time since the last request end to the placeholder. If no request ended since the last call, it uses the time since the last call. Picks the rung for `Q`. Applies the oscillation guard. Computes the delay. |
| `sample` | Records the sampled bandwidth as the current rung. Multiplies the placeholder by 0.99. Caps it so that the effective buffer at request start stays at or below the maximum buffer of that rung. Adds `duration` when `isReplacement` is true. |
| `sample` with `aborted` | Caps the placeholder at the threshold of the current rung, or at 10 seconds for rung 0. Does not change the current rung. |
| `reset` | Returns to the startup state and clears all history. |

The oscillation guard is the BOLA-O variant. Suppose the score picks a rung above both the current rung and the rung that the throughput sustains. Then the selector keeps the higher of the current rung and the sustained rung. The guard is skipped when the estimate is unknown.

The delay is `max(0, Q - maximumBuffer(rung))`. The selector drains the placeholder first. The remainder becomes `delay`. At the top rung the delay is always 0.

After a delay, the player calls `select` again. The second call adds the wait to the placeholder, and the real buffer is lower by the same amount, so `Q` is unchanged. The delay computation then drains the placeholder, and the call returns 0. A repeated delay is not a defect of the implementation.

### Stalls

The `BitrateSelector` type has no stall notification. In the steady state, the selector treats a `bufferLevel` at or below 0.3 seconds as a stall, in `select` and in `sample`. A stall sets the placeholder to 0 and clears the time bases. The value is the default `stallThreshold` of the dash.js `BufferController`, and it is an internal constant. The startup state ignores stalls, as dash.js ignores a buffer-empty event at time 0.

### Ladder changes

The selector compares the `bandwidth` of each rung and the `bufferTarget` with its stored copies in every `select` call. The comparison is O(N), allocates nothing, and detects in-place changes. A change rebuilds the derived values. The rebuild is the only step that validates the input.

The selector stores the current rung as a bandwidth, not as an index, as the type requires. After a rebuild it maps the bandwidth to the highest new rung at or below it.

In the steady state, the rebuild keeps the effective buffer equivalent. Each switch point depends only on the two neighbouring bandwidths. The selector converts `Q` to a quantity that does not depend on the ladder and converts it back:

```
theta        = (Q_old - 10) / V_old + ln(b_0_old)
Q_new        = 10 + V_new * (theta - ln(b_0_new))
placeholder  = max(0, Q_new - bufferLevel)
```

| Event | Selector behavior |
|---|---|
| The number of rungs changes (multi-period, MPD update) | Rebuild and apply the conversion in the steady state. The player passes the ladder of the period of the next segment. |
| The player changes the minimum or maximum bitrate, or the video size | The player filters the ladder. This is the same case as the previous row. |
| `bufferTarget` changes | Rebuild and apply the conversion. The decision for the same buffer level stays the same. |
| Seek or new source | The player calls `reset`. |
| The ladder gains or loses its second distinct rung | Return to the startup state. |

The [design record](./design.md) has the measured effect of the conversion on each case.

### Input validation

The shared rows of the bitrate selector RFC apply. An empty ladder, a bandwidth that is not a positive finite number, and a ladder out of ascending order throw a `RangeError`. Equal neighbouring bandwidths are accepted, and they merge into one rung with the highest index. An unknown throughput and an invalid buffer level have the shared meaning. BOLA adds two rows. Validation runs only on a rebuild and throws before it changes any state.

| Input | Behavior |
|---|---|
| `bufferTarget` not a positive finite number | Throws a `RangeError` that names the parameter, the expected value, and the received value. |
| `bufferTarget` below `10 + 2 * M` | Raised to `10 + 2 * M`. |

### Differences from dash.js

The selector follows `BolaRule.js` in dash.js, with these deliberate changes:

- The minimum and maximum buffer helpers use the same utility offset as the score. The dash.js helpers differ from the score by `V` seconds.
- The selector reads the ladder in every call and handles in-place ladder changes. dash.js builds its state once for each stream and media type.
- The selector indexes everything by position in the player ladder. dash.js mixes positions in a filtered list with indices in an unfiltered list.
- An unknown throughput does not block upward switches in the steady state.
- A stall is derived from the buffer level, and it clears the time bases of the placeholder.
- The player injects the time. dash.js reads `Date.now()`.

### Bundle and performance impact

Each file holds one export or one internal function, so bundlers drop unused code. The `select` call compares the ladder in O(N), scans thresholds in O(M), and allocates only the returned decision. A call without a ladder change does not call `Math.log`. The implementation PR will report the minified size.

### Testing

The implementation PR carries the full strategy. In short:

- Unit and property tests for the threshold math, with an independent score-based oracle.
- State machine tests for every row of the state table, the stall rule, and the wait accounting.
- One test for each row of the ladder change table.
- A seeded playback simulation that compares the selector with the throughput selector.
- A manual comparison with the dash.js `BolaRule` on the same ladder and buffer inputs.

The test fixtures are two ladders with a buffer target of 18 seconds. L1 is 300, 750, 1500, 3000, and 6000 kbps. L2 is 235, 375, 560, 750, 1050, 1750, 2350, 3000, 4300, and 5800 kbps. The [design record](./design.md) lists their reference values.

### Packaging

The selector joins `libs/abr`. It adds no package and no peer dependency. `ValueOf` for `BolaState` comes from `@svta/cml-utils` with `import type`. The exports carry the release tag of the package. The port derives from BSD-3 code, so `libs/abr/NOTICE.md` and the root `NOTICE` file get the dash.js attribution.

## Drawbacks

- The selector owns state. A player that forgets `sample` keeps the selector in the startup state.
- BOLA alone suits large buffers. A small buffer target needs a rate-based rule at low buffer levels. The player must combine the two.
- BOLA still stalls in the simplified simulation, and a real-buffer guard reduces the stalls. The selector does not include the guard in v1. See the [analysis](./analysis.md).
- The behavior can drift from dash.js. The list of deliberate differences and the manual comparison limit that risk.

## Rationale and alternatives

- **Omit the placeholder buffer and the oscillation guard.** This gives plain BOLA. The analysis shows that it starts slowly and reaches the top rungs late or never when the player buffer cap is below `B`.
- **A placeholder option.** In the simplified simulation, the placeholder is required when the player buffer cap is below `B`. At or above `B`, it adds a small bitrate gain and some stalls. The simulation cannot measure the faster startup and seek, so v1 keeps the placeholder on.
- **A real-buffer guard option.** dash.js pairs BOLA with a separate rule that blocks high rungs when the real buffer is small. The evidence for the guard is a simplified simulation, so players own the guard in v1. See Unresolved questions.
- **A paused flag.** The placeholder grows with wall-clock time, and a paused player also adds time. When the guard caps the rung, the delay drains the placeholder in one call. Otherwise `sample` caps the placeholder after one segment. The exposure is one segment at a rung the throughput already sustains, so there is no flag.
- **One selector for both media types.** dash.js keeps one state per media type, and the type contract creates one selector per media type. The documentation states the rule.
- **A multi-period reset.** dash.js wipes all state on a new period. The conversion keeps the buffer information, so the player passes the ladder of the next period and the selector adapts.

## Prior art

- [dash.js `BolaRule.js`](https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/BolaRule.js) is the reference implementation. It is tied to the dash.js event system and settings.
- [BOLA: Near-Optimal Bitrate Adaptation for Online Videos](https://arxiv.org/abs/1601.06748) defines the algorithm and its variants.
- dash.js combines BOLA with a throughput rule. It uses the throughput rule at low buffer levels and BOLA at high buffer levels.
- hls.js and shaka-player select rungs with exponentially weighted throughput estimates. Neither ships BOLA.

## Unresolved questions

1. **Real-buffer guard.** dash.js pairs BOLA with a separate rule that blocks high rungs when the real buffer is small. Should the selector offer this as an option, or should players own it?
2. **Dense ladders.** The `10 + 2 * M` rule gives a large `B` for ladders with many rungs. Take a test ladder of 20 rungs from 300 kbps to 6 Mbps with equal bandwidth ratios. The buffer rule never selects its two lowest rungs. Should the 2 seconds per rung become an option?
3. **Small buffer targets.** In the dash.js follow-up paper, a throughput rule oscillates less than BOLA with a 10 second buffer, for example in low-latency streams. The selector documents the limit and does not warn. Is that enough?
4. **Playback rate.** The throughput selector divides the throughput by `playbackRate`. BOLA v1 ignores the field, as dash.js does. Should the startup pick and the oscillation guard divide by it?

## Future possibilities

- A hybrid selector that uses the throughput selector at low buffer levels and BOLA at high buffer levels. The startup rule turns the real buffer into BOLA state in one call, so BOLA works as the upper child.
- A real-buffer guard option, depending on the answer to question 1.
- Public pure functions for players that keep their own state.

## Revision history

- v1 (2026-10-05): initial draft.
- v2 (2026-10-18): rebased on the accepted bitrate selector RFC. The selector is a factory, `createBolaSelector`, over the shared input, sample, and `LadderRung` types. Names are plain with the units in the TSDoc. The RFC states the stall rule, the wait accounting, and the L2 fixture. Questions 4 to 7 of v1 became decisions in Rationale and alternatives, and questions 8 to 10 are answered by the bitrate selector RFC. The analysis and the design record moved into this folder.

## Final Decision

Pending maintainer review.
