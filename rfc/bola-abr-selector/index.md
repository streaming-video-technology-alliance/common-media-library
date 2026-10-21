---
status: accepted
---

# RFC: BOLA bitrate selector (`@svta/cml-abr`)

| | |
|---|---|
| **Author** | Nicolas Caballero |
| **Date** | 2026-10-05 (revised 2026-10-20) |
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

A player picks a rung before every segment request. The throughput selector of `@svta/cml-abr` picks the rung that the throughput estimate sustains. The estimate is noisy and reacts late to drops. The quality oscillates when the estimate sits between two rungs. hls.js and shaka-player select rungs this way.

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
const first = selector.select({ ladder, bufferLevel: 0, throughput: estimator.getEstimate(), now: 0, segmentDuration: 4 })

// The player downloads a 4 second segment of rung 0 (150,000 bytes) in 400 ms, at 3 Mbps.
const timing = { startTime: 0, encodedBodySize: 150_000, duration: 400 }
estimator.sample(timing)
selector.sample({ timing, bandwidth: ladder[first.index].bandwidth, duration: 4, bufferLevel: 0 })

// Second request. The estimate is 3 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladder, bufferLevel: 4, throughput: estimator.getEstimate(), now: 400, segmentDuration: 4 })
```

What BOLA adds to the shared rules:

- `delay` is positive when the buffer is above the maximum level of the chosen rung. After the wait, call `select` again. The selector adds the wait to its placeholder buffer, and the second call returns a delay of 0. A player that ignores the delay fills the buffer with the selected rung until the real buffer passes the next threshold. The cost is lower quality, not a stall.
- `bufferTarget` sets the buffer level at which BOLA reaches the top rung. The default is `BOLA_DEFAULT_BUFFER_TARGET`. Pass the field in every call or in none.
- The starvation guard of the throughput selector runs on every pick when the input has a positive `segmentDuration`. The guard lowers the pick when the download of the next segment does not fit in the real buffer. The guard never raises a pick. A live player omits `segmentDuration` to skip the guard, as for the throughput selector.
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

The values 10 seconds and 2 seconds per rung come from dash.js. The dash.js follow-up paper calls this buffer expansion. It stretches `V` and `gamma` so that the thresholds move apart while the real segments stay within the player buffer. In the example of the paper, the thresholds are at least 2 seconds apart. For an effective buffer `Q` in seconds, BOLA scores each rung and picks the best score:

```
score_i(Q) = (V * (v_i + gamma) - Q) / b_i
```

On a tie, the selector picks the higher rung. The selector does not evaluate scores at run time. It precomputes one threshold for each rung and picks the highest rung with a threshold at or below `Q`:

```
threshold_0 = 0
threshold_i = max(0, V * (gamma + (b_i * v_(i-1) - b_(i-1) * v_i) / (b_i - b_(i-1))))
```

A unit test compares these thresholds with a direct search of the score function. The score of rung `i` reaches zero at `V * (v_i + gamma)`. This level is the maximum buffer of the rung.

The formulas need two distinct bandwidths. For one distinct rung, `v_(M-1)` is 0, and the selector derives no values. The state machine states the decision for that case.

### Export surface

The selector implements `BitrateSelector` and reads `ladder`, `bufferLevel`, `throughput`, `now`, and `bufferTarget` from the input. The starvation guard also reads `segmentDuration` and `playbackRate`. The BOLA rules ignore both fields. The state uses the repo const enum pattern. Units are bits per second and seconds, stated in the TSDoc.

```ts
export const BolaState = { STARTUP: 'startup', STEADY: 'steady' } as const
export type BolaState = ValueOf<typeof BolaState>

export type BolaDecision = BitrateDecision & {
	readonly state: BolaState
	readonly placeholder: number    // placeholder buffer in seconds after the call
}

export type BolaSelector = Omit<BitrateSelector, 'select'> & {
	select(input: BitrateSelectorInput): BolaDecision
}

export type BolaSelectorOptions = {
	safetyFactor?: number           // @defaultValue DEFAULT_SAFETY_FACTOR
	starvationTolerance?: number    // seconds, @defaultValue DEFAULT_STARVATION_TOLERANCE
}

export function createBolaSelector(options?: BolaSelectorOptions): BolaSelector
```

`BolaSelector` omits the `select` of `BitrateSelector` and adds a narrower one. A plain intersection of the two `select` signatures resolves to the first one, so its result would lose `state` and `placeholder`. Every `BolaSelector` is still a `BitrateSelector`.

The package also exports `BOLA_DEFAULT_BUFFER_TARGET` (18 seconds). `safetyFactor` and `starvationTolerance` have the meaning and the bounds of the throughput selector options with the same names. `DEFAULT_SAFETY_FACTOR` and `DEFAULT_STARVATION_TOLERANCE` are their defaults. The threshold functions, the ladder validation, and the other helpers stay internal.

### State machine

The selector keeps a placeholder buffer. This is virtual buffer time that the selector adds to the real buffer level. The effective buffer `Q` is the sum of both. The placeholder lets startup and seeks begin at a sustainable rung instead of the lowest rung. The time bases of the placeholder come from the sample: the request end is `timing.startTime + timing.duration`.

| Input | Effect |
|---|---|
| `select`, startup state | Picks the highest rung at or below `throughput * safetyFactor`. Picks rung 0 when the estimate is unknown. Applies the starvation guard. Sets the placeholder to `max(0, threshold - bufferLevel)` for that rung. Moves to the steady state after the first `sample` call, when the buffer holds at least one segment. |
| `select`, steady state | Adds the wall-clock time since the last request end to the placeholder. If no request ended since the last call, the selector uses the time since the last call. If the ladder or the buffer target changed, converts `Q`. See Ladder changes. Picks the rung for `Q`. Applies the oscillation guard. Applies the starvation guard. Computes the delay. |
| `select`, one distinct rung | Returns the highest index of that rung with a delay of 0. The decision reports the startup state and a placeholder of 0. |
| `sample` | Records the sampled bandwidth as the current rung. Multiplies the placeholder by 0.99. Caps it so that the effective buffer at request start stays at or below the maximum buffer of that rung. Adds `duration` when `isReplacement` is true. |
| `sample` with `aborted` | Treats the next lower rung as the replacement. Sets the current rung to that rung. Caps the placeholder so that the effective buffer stays at or below the threshold of that rung. A `select` directly after the abort picks the replacement rung when the cap applies. The oscillation guard then blocks a return to the aborted rung until the throughput sustains it. For rung 1 the limit is 0, because `threshold_0` is 0. For rung 0 the current rung stays, and the limit is 10 seconds. |
| `reset` | Returns to the startup state and clears all history. |

The oscillation guard is the BOLA-O variant. Suppose the score picks a rung above both the current rung and the rung that the throughput sustains. Then the selector keeps the higher of the current rung and the sustained rung. The guard is skipped when the estimate is unknown.

The starvation guard runs after the oscillation guard and before the delay, in both states. It runs when the input has a positive `segmentDuration` and the estimate is known. The formula and the two passes are those of the throughput selector in the [bitrate selector RFC](../bitrate-selector.md). The guard never raises the pick. A lowered pick becomes the current rung. When the guard lowers the pick, the selector skips the delay step.

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

`Q_old` includes the elapsed time of the call. The selector adds the elapsed time to the placeholder before the conversion. Otherwise the conversion would scale the placeholder but not the elapsed time, and the pick could change.

| Event | Selector behavior |
|---|---|
| The number of rungs changes (multi-period, MPD update) | Rebuild and apply the conversion in the steady state. The player passes the ladder of the period of the next segment. |
| The player changes the minimum or maximum bitrate, or the video size | The player filters the ladder. This is the same case as the previous row. |
| `bufferTarget` changes | Rebuild and apply the conversion. The decision for the same buffer level stays the same, unless the conversion needs a negative placeholder. Then the placeholder is 0 and the real buffer decides. |
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
- An unknown throughput at startup picks rung 0. dash.js makes no decision until an estimate exists.
- `M` counts the distinct bandwidths. dash.js counts the representations.
- After an aborted download, the selector treats the next lower rung as the replacement. dash.js uses the rung that the abandon rule picks from the throughput. The selector input has no replacement rung. Both set the current rung to the replacement and cap the effective buffer at the threshold of that rung.
- After a change of the buffer target, the selector adds the elapsed time and then converts the effective buffer. dash.js converts first and then adds the elapsed time.
- The starvation guard is part of the selector. dash.js runs `InsufficientBufferRule` as a separate rule with the same cap, `safeThroughput * bufferLevel / segmentDuration`. After a buffer-empty event, that rule drops to rung 0. The selector empties the placeholder and runs the guard with its second pass.

### Bundle and performance impact

Each file holds one export or one internal function, so bundlers drop unused code. The `select` call compares the ladder in O(N), scans thresholds in O(M), and allocates only the returned decision. A call without a ladder change does not call `Math.log`. The starvation guard shares one function with the throughput selector, so a bundle with both selectors includes the guard once. The implementation PR will report the minified size.

### Testing

The implementation PR carries the full strategy. In short:

- Unit and property tests for the threshold math, with an independent score-based oracle.
- State machine tests for every row of the state table, the stall rule, and the wait accounting.
- One test for each row of the ladder change table.
- A seeded playback simulation that compares the selector with the throughput selector.
- A manual comparison with the dash.js `BolaRule` on the same ladder and buffer inputs.
- Guard tests: the pick drops at a low buffer and stays at a healthy buffer. A call without `segmentDuration` skips the guard.
- The seeded simulation with the guard on and off. The implementation PR reports the stall counts of both runs.

The test fixtures are two ladders with a buffer target of 18 seconds. The bandwidths are in bits per second:

```ts
const L1: LadderRung[] = [
	{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 },
]

const L2: LadderRung[] = [
	{ bandwidth: 235_000 }, { bandwidth: 375_000 }, { bandwidth: 560_000 }, { bandwidth: 750_000 }, { bandwidth: 1_050_000 },
	{ bandwidth: 1_750_000 }, { bandwidth: 2_350_000 }, { bandwidth: 3_000_000 }, { bandwidth: 4_300_000 }, { bandwidth: 5_800_000 },
]
```

The [design record](./design.md) lists their reference values.

### Packaging

The selector joins `libs/abr`. It adds no package and no peer dependency. `ValueOf` for `BolaState` comes from `@svta/cml-utils` with `import type`. The exports carry `@beta`, the release tag of the package. The bitrate selector RFC keeps `@beta` until a second selector ships. BOLA is that selector, so its release is the point where the maintainers decide on `@public`. The port derives from BSD-3 code, so `libs/abr/NOTICE.md` and the root `NOTICE` file get the dash.js attribution.

## Drawbacks

- The selector owns state. A player that forgets `sample` keeps the selector in the startup state.
- BOLA suits large buffers best. The 10 second oscillation finding of the dash.js follow-up paper is for the original BOLA. That variant has no placeholder and no insufficient buffer rule. The answer of the paper for small buffers is buffer expansion plus that rule, and the selector has both. dash.js still runs BOLA only above 10 seconds in its default strategy, so a small buffer target needs care. A player can combine the selector with a rate-based rule at low buffer levels.
- The placeholder lets BOLA pick a rung that the real buffer alone would not sustain. In the simulation of the implementation PR, BOLA without a guard stalls more often than `createThroughputSelector` and picks higher rungs. The starvation guard limits that risk when the player passes `segmentDuration`. A player that omits the field owns the stall risk. See the [analysis](./analysis.md).
- The behavior can drift from dash.js. The list of deliberate differences and the manual comparison limit that risk.

## Rationale and alternatives

- **Omit the placeholder buffer and the oscillation guard.** This gives plain BOLA. The analysis shows that it starts slowly and reaches the top rungs late or never when the player buffer cap is below `B`.
- **A placeholder option.** In the simplified simulation, the placeholder is required when the player buffer cap is below `B`. At or above `B`, it adds a small bitrate gain and some stalls. The simulation cannot measure the faster startup and seek, so v1 keeps the placeholder on.
- **A real-buffer guard.** dash.js pairs BOLA with `InsufficientBufferRule`, on by default. That rule has the cap of the starvation guard of `createThroughputSelector`. The guard variant of the analysis ignores the placeholder below two segments. That variant removes at most a third of the stalls in the simplified simulation. The selector runs the shared starvation guard instead, with the trigger and the option of the throughput selector. A player cannot add the guard from outside without a second selector, and every player would repeat that code. The v5 decision left the guard to players. Revision v6 reverses that decision.
- **A paused flag.** The placeholder grows with wall-clock time, and a paused player also adds time. When the guard caps the rung, the delay drains the placeholder in one call. Otherwise `sample` caps the placeholder after one segment. The exposure is one segment at a rung the throughput already sustains, so there is no flag.
- **One selector for both media types.** dash.js keeps one state per media type, and the type contract creates one selector per media type. The documentation states the rule.
- **A multi-period reset.** dash.js wipes all state on a new period. The conversion keeps the buffer information, so the player passes the ladder of the next period and the selector adapts.

## Prior art

- [dash.js `BolaRule.js`](https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/BolaRule.js) is the reference implementation. It is tied to the dash.js event system and settings.
- [BOLA: Near-Optimal Bitrate Adaptation for Online Videos](https://arxiv.org/abs/1601.06748) defines the algorithm, its variants, and the download abandonment heuristic of BOLA-FINITE.
- [From Theory to Practice: Improving Bitrate Adaptation in the DASH Reference Player](https://doi.org/10.1145/3336497), ACM TOMM 2019. This paper is the journal version of the dash.js follow-up paper in the analysis. It describes the placeholder algorithm, the insufficient buffer rule, BOLA-E, DYNAMIC, FAST SWITCHING, and the Sabre simulator.
- hls.js and shaka-player select rungs with exponentially weighted throughput estimates. Neither ships BOLA.

## Unresolved questions

The placeholder option is a decision in Rationale and alternatives, because the simulation answers it. Question 3 stays open, because the proposed answer is documentation only and needs agreement.

1. **Real-buffer guard.** dash.js pairs BOLA with a separate rule that blocks high rungs when the real buffer is small. Should the selector offer this as an option, or should players own it?
2. **Dense ladders.** The `10 + 2 * M` rule gives a large `B` for ladders with many rungs. Take a test ladder of 20 rungs from 300 kbps to 6 Mbps with equal bandwidth ratios. The buffer rule never selects its two lowest rungs. Should the 2 seconds per rung become an option?
3. **Small buffer targets.** In the dash.js follow-up paper, a throughput rule oscillates less than the original BOLA with a 10 second buffer. That is the buffer size of a low-latency stream. BOLA-E, with buffer expansion and the insufficient buffer rule, oscillates less than the original BOLA at that size. The selector has both parts. It documents the limit and does not warn. Is that enough?
4. **Playback rate.** The throughput selector divides the throughput by `playbackRate`. BOLA v1 ignores the field, as dash.js does. Should the startup pick and the oscillation guard divide by it?

## Future possibilities

- A hybrid selector that uses the throughput selector at low buffer levels and BOLA at high buffer levels. The startup rule turns the real buffer into BOLA state in one call, so BOLA works as the upper child.
- Public pure functions for players that keep their own state.

## Revision history

- v1 (2026-10-05): initial draft.
- v2 (2026-10-18): rebased on the bitrate selector RFC. The selector is a factory, `createBolaSelector`, over the shared input, sample, and `LadderRung` types. Names are plain with the units in the TSDoc. The RFC states the stall rule, the wait accounting, and the L2 fixture. Questions 2, 5, 6, and 7 of v1 became decisions in Rationale and alternatives. The bitrate selector RFC answers questions 8 to 10. The analysis and the design record moved into this folder.
- v3 (2026-10-19): `BolaSelector` omits the `select` of `BitrateSelector`, so the result type keeps `state` and `placeholder`. The L2 test fixture is listed as `LadderRung` objects.
- v4 (2026-10-19): states the abort cap as an effective buffer limit, adds the one-rung row to the state machine, and gives the startup placeholder formula. Lists two more differences from dash.js and the `@beta` tag. Corrects the v2 entry on the closed questions.
- v5 (2026-10-19): status set to `accepted`.
- v6 (2026-10-20): corrections after the review of the implementation PR. An aborted sample treats the next lower rung as the replacement, for the current rung and for the cap. Before, a cap at the threshold of the current rung picked that rung again. The conversion after a ladder or buffer target change runs after the selector adds the elapsed time. The `bufferTarget` row states the negative placeholder exception. The drawbacks and the analysis state the stall comparison with `createThroughputSelector`. The selector runs the starvation guard of the throughput selector when the input has `segmentDuration`, and `BolaSelectorOptions` gains `starvationTolerance`. Three more differences from dash.js. The analysis attributes the 10 second oscillation finding to the original BOLA and corrects the comparison with MPC and Pensieve.

## Final Decision

Accepted on 2026-10-19. The RFC PR #505 carries the export surface above as the contract. The implementation follows the draft on the open questions:

- players own the real-buffer guard in v1
- the 2 seconds per rung stay fixed, and the documentation states the floor for dense ladders
- the documentation states the small buffer limit, and the selector does not warn
- BOLA v1 ignores `playbackRate`

The bitrate selector RFC #526 defines the type. BOLA is its second implementation.

Amended on 2026-10-20 (v6). The selector runs the starvation guard of the throughput selector when the input has `segmentDuration`. This replaces the first bullet above. The BOLA rules still ignore `playbackRate`, and the guard reads the field as in the throughput selector. An aborted sample treats the next lower rung as the replacement, for the current rung and for the cap. The conversion runs after the selector adds the elapsed time. The package documentation states the stall comparison with `createThroughputSelector`.
