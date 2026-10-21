# BOLA selector design

This record holds the design details behind the [RFC](./index.md). The RFC defines the public contract. This record explains the derivations, the internal structure, and the measured effect of the ladder change policy. The [analysis](analysis.md) holds the evidence for the choices.

## Goals and non-goals

Goals:

- A selector that has no player dependency and no hidden clock.
- The same decisions as dash.js where the dash.js rule is correct.
- A defined behavior for every change of the ladder or the buffer target.
- Every export carries TSDoc, and every public behavior has a test.
- The starvation guard, shared with the throughput selector.

Non-goals for v1:

- Throughput estimation. The caller supplies a number.
- A hybrid selector that switches between a rate-based rule and BOLA.
- An abandon-decision rule.
- Variable segment sizes. The selector uses the bitrate of a rung as its size.

## Structure

The package has two layers. The internal functions are pure and hold the math. `createBolaSelector` holds the state in its closure and calls them. One file holds one export, one internal function, or one group of related constants.

| File | Layer | Role |
|---|---|---|
| `BolaParams.ts` | Internal | The type of the values that BOLA derives from a ladder and a buffer target. |
| `createBolaParams.ts` | Internal | Turns a ladder and a buffer target into the thresholds, the maximum buffers, and `V`. |
| `isSameLadder.ts` | Internal | Compares a ladder with a stored copy, with no allocation. |
| `selectRungByBuffer.ts` | Internal | Returns the highest rung with a threshold at or below the effective buffer. |
| `remapEffectiveBuffer.ts` | Internal | Converts the effective buffer between two parameter sets. |
| `limitUpwardSwitch.ts` | Internal | Applies the oscillation guard to a pick. |
| `applyStarvationGuard.ts` | Internal | Applies the starvation guard to a pick. It moved out of `createThroughputSelector.ts`, and both selectors share it. |
| `computeDelay.ts` | Internal | Returns the delay that remains after the placeholder absorbs part of an excess buffer. |
| `validateBufferTarget.ts` | Internal | Throws a `RangeError` for an invalid buffer target. |
| `placeholderAfterSample.ts` | Internal | Returns the placeholder after a finished download: decay, cap, and replacement growth. |
| `placeholderAfterAbort.ts` | Internal | Returns the placeholder after an aborted download. |
| `BOLA_CONSTANTS.ts` | Internal | The named constants: 10, 2, 0.99, 0.3, the negligible delay of 0.001, the threshold tolerance of 1e-9, and the 2 finished samples that the guard waits for. |
| `MILLISECONDS_PER_SECOND.ts` | Internal | The unit constant 1000. |
| `validateLadder.ts`, `findRung.ts`, `isPositiveFinite.ts`, `validateFactor.ts` | Internal | Shared with the throughput selector. |
| `BOLA_DEFAULT_BUFFER_TARGET.ts` | Public | The named default, 18. The safety factor default is the shared `DEFAULT_SAFETY_FACTOR`. |
| `DEFAULT_STARVATION_SAFETY_FACTOR.ts` | Public | The named default of the guard factor, 0.7, from dash.js. |
| `BolaState.ts` and the three type files | Public | The state and the types in the RFC export surface. |
| `createBolaSelector.ts` | Public | The selector factory. |

Internal tests import from the source files. Public tests import from `@svta/cml-abr`.

## Math

### Why the thresholds equal the score maximum

The score of a rung is `(V * (v_i + gamma) - Q) / b_i`. Because `V * gamma` is 10, the numerator equals `V * (ln(b_i) - theta)` with `theta = (Q - 10) / V + ln(b_0)`. The score is proportional to a function `f(b) = (ln(b) - theta) / b`.

The function `f` rises up to `b = e^(theta + 1)` and falls after it. This has three consequences:

1. Every rung is selectable. No rung is dominated by its neighbours.
2. Rung `i` beats rung `i - 1` exactly when `theta` is at least `(b_i * ln(b_(i-1)) - b_(i-1) * ln(b_i)) / (b_i - b_(i-1))`. This value depends only on the two neighbouring bitrates.
3. The best rung never decreases when `theta`, and so `Q`, increases. The selector can scan the adjacent thresholds in order.

The RFC formula for `threshold_i` is this switch point converted back to a buffer level in seconds. A scratch script checked 20,000 random ladders and 600,000 buffer levels. It found no difference between the threshold scan and a direct maximum of the score. In every ladder the thresholds increased from one rung to the next. The implementation includes the same check as a seeded test.

### Clamping

The threshold of a rung can be negative. The selector clamps it to 0. Then the buffer rule never picks a rung below the highest rung with a threshold of 0.

The second threshold shows the three causes. It equals `max(0, 10 - (B - 10) * (v_1 / v_max) / (b_1 / b_0 - 1))`. It is 0 when `(B - 10) * v_1 / v_max` is at least `10 * (b_1 / b_0 - 1)`:

- A ladder with many rungs makes `B` large and `v_1 / v_max` small.
- A large buffer target makes `B` large.
- Two lowest rungs with close bandwidths make `b_1 / b_0 - 1` small.

A ladder of two rungs with the default target has `B` of 18 and `v_1 / v_max` of 1. Its second threshold is 0 for a bandwidth ratio of 1.8 or less. The RFC lists the dense ladder case as an open question.

### Startup handoff

At startup the selector picks rung `q` from the throughput and sets the placeholder to `max(0, threshold_q - bufferLevel)`. The effective buffer is then at least `threshold_q`. The first steady-state call selects rung `q` or higher, and the oscillation guard then limits the rise.

### Reference values

Two ladders serve as test fixtures. Both use a buffer target of 18 s. L1 is 300 kbps, 750 kbps, 1.5 Mbps, 3 Mbps, and 6 Mbps. L2 has 10 rungs from 235 kbps to 5.8 Mbps.

| Ladder | `B` | `V` | Thresholds in seconds |
|---|---|---|---|
| L1 | 20 | 3.3381 | 7.961, 10.745, 13.059, 15.372 |
| L2 | 30 | 6.2382 | 5.106, 7.845, 10.046, 11.992, 14.558, 17.161, 18.857, 20.705, 22.782 |

The thresholds are the buffer levels where the selector moves up one rung. The next sections use these fixtures.

## State machine

The selector keeps these fields:

| Field | Meaning |
|---|---|
| `state` | `startup` or `steady`. |
| `placeholder` | The placeholder buffer in seconds. |
| `currentBandwidth` | The bandwidth of the last rung sampled or selected. The selector stores a bandwidth, not an index. |
| `lastSegmentDuration` | The duration of the last loaded segment. Unknown until the first segment. |
| `lastRequestEnd`, `lastCall` | The time bases for the wall-clock part of the placeholder. |
| The finished sample count | The number of finished samples since the last reset, capped at 2. The starvation guard waits for 2. |
| The ladder copy and the buffer target | The inputs of the last rebuild. |

A call to `select` runs these steps:

1. Compare the ladder and the buffer target with the stored copies. On a difference, validate and build the new values. See the next section.
2. Sanitize `bufferLevel` and `throughput`.
3. If the ladder has one distinct rung, return its highest index with a delay of 0.
4. In the startup state, pick the rung from the throughput, set the placeholder, and test the move to steady.
5. In the steady state, add the elapsed time to the placeholder. If step 1 built new values, convert the effective buffer to the new values. Apply the stall rule. Select the rung for the effective buffer. Then apply the oscillation guard, apply the starvation guard, and compute the delay.

The conversion runs before the stall rule. When `V` shrinks, the conversion maps a buffer below 10 s to a higher buffer. The stall rule must still leave a placeholder of 0.

The effective buffer is the real buffer plus the placeholder. The delay is `max(0, effective - maximumBuffer(rung))`. The selector removes the delay from the placeholder first. The remainder is the returned delay. At the top rung the returned delay is 0.

### Reference scenarios

With ladder L1 and a target of 18 s, these inputs give these decisions:

| Scenario | Decision |
|---|---|
| Startup, throughput 1 Mbps, buffer 0 s | Rung 1. The placeholder equals the threshold of rung 1, 7.961 s. |
| Steady, placeholder 0 s, current rung 750 kbps, buffer 14.5 s, throughput 10 Mbps | Rung 3. |
| The same, throughput 1.2 Mbps | Rung 1 and a delay of 1.441 s. |
| The same, throughput 2 Mbps | Rung 2 and no delay. |
| The same, throughput unknown | Rung 3. The oscillation guard is skipped. |

### Abort cap

After an aborted download, the selector treats the next lower rung as the replacement. The current rung moves to that rung. The cap keeps the effective buffer at or below the threshold of that rung. At a threshold, the tie rule picks the higher rung. A cap at the threshold of the aborted rung then picks that rung again. While the aborted rung is the current rung, a lower throughput estimate does not change that pick. The oscillation guard limits upward moves only. With the replacement as the current rung, a return to the aborted rung is an upward move. The guard allows that move only when the throughput sustains the aborted rung.

Take L1, a current rung of 3 Mbps, and a real buffer of 7 s after the abort. A cap at the threshold of 3 Mbps gives 13.059 s, and the pick is 3 Mbps. A cap at the threshold of 1.5 Mbps gives 10.745 s, and the pick is 1.5 Mbps.

The cap sets the effective buffer to a threshold on purpose, and the effective buffer is the sum of two numbers. Rounding can put that sum one error below the threshold. Some thresholds of L2 show this for a few percent of the buffer levels. The tie rule would then not apply, and the pick would be the rung below the replacement. `selectRungByBuffer` therefore counts an effective buffer within one nanosecond below a threshold as at the threshold.

The BOLA paper gives a download abandonment heuristic for BOLA-FINITE in section IV.D and Fig. 7. The player abandons a segment at level `m`. The player then downloads the segment at the level below `m` with the best score. The next decision compares with the bandwidth and the level of that download. The selector follows that order, so the replacement becomes the current rung. dash.js sets the current representation to the replacement rung and caps at the minimum buffer of that rung. The abandon rule of dash.js picks the replacement from the throughput. The selector input has no replacement rung, so the selector assumes the next lower rung. In the paper, that level wins while the effective buffer is at or above the threshold of that level.

### Starvation guard

The guard is the starvation guard of the throughput selector, applied to the BOLA pick with one pass. The download time of a rung is `bandwidth * segmentDuration / (throughput * starvationSafetyFactor)`. The budget is `bufferLevel / playbackRate`. The guard keeps the highest rung, at or below the pick, within the budget. Rung 0 always passes. There is no second pass. The startup state and the two-sample wait cover the empty buffer at startup and after a seek.

The guard has its own factor. One download varies more than the smoothed estimate, from estimate error, segment size, and request latency. The guard binds only at a low real buffer, so a large margin costs little bitrate. `safetyFactor` binds on every upward move, so a large margin there costs bitrate for the whole session. The paper uses 0.5 and dash.js uses 0.7. The selector takes 0.7. The table shows the highest rung that each factor allows with 4 s segments, a 6 s real buffer, and an exact estimate.

| Factor | Allowed rung | Download time | Buffer left after the download |
|---|---|---|---|
| 0.9 | 1.35 times the estimate | 5.4 s | 0.6 s |
| 0.7 | 1.05 times the estimate | 4.2 s | 1.8 s |
| 0.5 | 0.75 times the estimate | 3.0 s | 3.0 s |

The guard runs after the oscillation guard, so a lowered pick is the current rung. When the guard lowers the pick, the selector skips the delay step. A wait would drain a buffer that the guard found too short for the download.

The guard waits for two finished samples since the last reset. dash.js ignores its rule until two segments are in the buffer, with the setting `segmentIgnoreCount`. The wait keeps the startup and seek ramp of the placeholder. Without the wait, the second pick drops one rung whenever the startup rung is between 0.7 and 0.9 times the estimate.

The cap of `InsufficientBufferRule` in dash.js is `bandwidth <= safeThroughput * bufferLevel / segmentDuration`, with a safety factor of 0.7. That inequality is the guard with a budget of `bufferLevel`. The paper states the rule with a factor of 0.5. dash.js runs the rule next to BOLA by default and disables it in low-latency mode. The smoke test of the implementation PR had the rule active in both players.

The startup state maps these throughputs to these rungs:

| Throughput | 250 kbps | 340 kbps | 850 kbps | 1 Mbps | 3.3 Mbps | 3.4 Mbps | 10 Mbps |
|---|---|---|---|---|---|---|---|
| Rung | 0 | 0 | 1 | 1 | 2 | 3 | 4 |

## Ladder changes

### Why the conversion keeps the decision

A rung switch point depends only on `theta` and on the two neighbouring bitrates. It does not depend on `V` or on the other rungs. A rebuild changes `V` and `ln(b_0)`. It does not change what `theta` means for a given pair of neighbours. Suppose the selector keeps `theta` and recomputes `Q`. Then the decision for the same situation stays the same. There are two exceptions: the rungs that the change added or removed, and the floor on the placeholder, described below.

The conversion runs after the selector adds the elapsed time, so `Q_old` includes the wait. A conversion before that step would scale the placeholder and not the wait. The pick could then change. For L1 and a target change from 18 s to 40 s, the error is twice the elapsed time.

The [RFC](./index.md) gives the conversion formulas under Ladder changes.

The conversion is exact when `Q_new` is at least the real buffer level. The placeholder cannot be negative. If `Q_new` is lower, the placeholder is 0 and the effective buffer is the real buffer, which is above `Q_new`. The pick can then be higher than before. Take L1 with an empty placeholder and a real buffer of 6 s. A change of the target from 18 s to 40 s moves the pick from 300 kbps to 750 kbps.

### Measured effect

Take a change of the buffer target from 18 s to 40 s on L1. The selector can keep the placeholder unchanged. Then the decision changes for 62% of the effective buffer levels between 0 s and 30 s. With the conversion of the effective buffer, no decision changes. The grid has 2,401 levels and no elapsed time. The selector adds the elapsed time before the conversion, so the result applies to any wait.

For a change of the ladder, the conversion changes decisions only where the added or removed rung lives:

| Change to L1 | Decisions that change |
|---|---|
| Add a 12 Mbps rung | Levels that chose 6 Mbps. Some now choose 12 Mbps. |
| Remove the 6 Mbps rung | Levels that chose 6 Mbps. They now choose 3 Mbps. |
| Remove the 300 kbps rung | Levels that chose 300 kbps. They now choose 750 kbps. |
| Add a 2.2 Mbps rung | Levels that chose 1.5 Mbps or 3 Mbps. Some now choose 2.2 Mbps. |
| Remove the 1.5 Mbps rung | Levels that chose 1.5 Mbps. They now choose 750 kbps or 3 Mbps. |

A steady-state call with real buffer 7 s, placeholder 4 s, current rung 1.5 Mbps, and throughput 10 Mbps shows the placeholder after each change. The selected rung stays at 1.5 Mbps in every case.

| Change | Placeholder after the call |
|---|---|
| None | 4.000 s |
| Add a 12 Mbps rung | 3.975 s |
| Remove the 6 Mbps rung | 4.041 s |
| Remove the 300 kbps rung | 0.627 s |
| Add a 2.2 Mbps rung | 4.200 s |
| Buffer target from 18 s to 40 s | 6.000 s |

### Why not reset

dash.js resets all state when the minimum bitrate, the maximum bitrate, or the video size changes. The selector returns to startup and picks from the throughput. This discards the information in the buffer level. The conversion keeps it. A caller that prefers the dash.js behavior can call `reset`.

### Change of the number of distinct rungs

A ladder with one distinct rung makes no BOLA decision. When the ladder gains a second distinct rung, or loses all but one, the selector returns to the startup state with no placeholder. This case has no buffer-based decision to preserve. The selector also forgets the duration of the last segment, so it stays in the startup state until the next sample.

## Comparison with dash.js

The implementation PR ran a comparison outside the repository. A script feeds the same events to the `BolaRule` of dash.js and to the selector, and it compares every decision. The events are selections, finished segments, replacement segments, aborted downloads, waits, and seeks. Random sequences covered both test ladders and two buffer targets.

The script corrects the two buffer helpers of dash.js first, as the RFC lists under the differences. It passes the next lower rung as the replacement of an aborted download. Then it found no difference except these:

- An unknown throughput. In the steady state, dash.js blocks upward switches and the selector does not. The script always passes a throughput.
- A stall. dash.js reacts to an event, and the selector derives the stall from the buffer level. The script ends a sequence at the first stall.
- The cap after an abort of the second rung. When the replacement is rung 0, dash.js caps the effective buffer at 10 seconds. The selector caps it at `threshold_0`, which is 0, as the RFC states. The script does not abort the second rung.
- A tie. After a cap, the effective buffer equals a threshold in exact arithmetic. dash.js scores the rungs, so rounding decides its pick. The selector counts a buffer within one nanosecond below a threshold as at the threshold. The script accepts a difference of one rung within a microsecond of a threshold.
- A change of the buffer target. dash.js converts first and then adds the elapsed time. The script keeps the buffer target fixed in each sequence.
- A stale timing. After an aborted request in the startup state, dash.js can apply the timing of the previous request to the next segment. The selector uses the timing of each sample. The script does not abort requests in the startup state.

## Validation messages

Validation runs on a rebuild only. Each message names the parameter, the expected value, and the received value. Examples:

```
Invalid ladder: expected a positive finite bandwidth at 1, received NaN
Invalid ladder: expected ascending bandwidth, received 750000 at 0 and 300000 at 1
Invalid bufferTarget: expected a positive finite number of seconds, received -3
```

An error leaves the selector state unchanged. The selector validates and builds the new values before it replaces the old ones.
