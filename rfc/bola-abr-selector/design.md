# BOLA selector design

This record holds the design details behind the [RFC](./index.md). The RFC defines the public contract. This record explains the derivations, the internal structure, and the measured effect of the ladder change policy. The [analysis](analysis.md) holds the evidence for the choices.

## Goals and non-goals

Goals:

- A selector that has no player dependency and no hidden clock.
- The same decisions as dash.js where the dash.js rule is correct.
- A defined behavior for every change of the ladder or the buffer target.
- Every export carries TSDoc, and every public behavior has a test.
- The starvation guard of the throughput selector, shared with that selector.

Non-goals for v1:

- Throughput estimation. The caller supplies a number.
- A hybrid selector that switches between a rate-based rule and BOLA.
- An abandon-decision rule.
- Variable segment sizes. The selector uses the bitrate of a rung as its size.

## Structure

The package has two layers. The internal functions are pure and carry the math. `createBolaSelector` holds the state in its closure and calls them. One file holds one export or one internal function.

| File | Layer | Role |
|---|---|---|
| `createBolaParams.ts` | Internal | Turns a ladder and a buffer target into the thresholds, the maximum buffers, and `V`. |
| `validateLadder.ts` | Internal | Throws a `RangeError` for an invalid ladder. |
| `isSameLadder.ts` | Internal | Compares a ladder with a stored copy, with no allocation. |
| `selectRungByBuffer.ts` | Internal | Returns the highest rung with a threshold at or below the effective buffer. |
| `selectRungByThroughput.ts` | Internal | Returns the highest rung at or below a bitrate. |
| `remapEffectiveBuffer.ts` | Internal | Converts the effective buffer between two parameter sets. |
| The starvation guard function | Internal | Moved out of `createThroughputSelector.ts` and shared by both selectors. |
| `MINIMUM_BUFFER.ts`, `MINIMUM_BUFFER_PER_RUNG.ts`, `PLACEHOLDER_DECAY.ts`, `STALL_THRESHOLD.ts` | Internal | Named constants, 10, 2, 0.99, and 0.3. |
| `BOLA_DEFAULT_BUFFER_TARGET.ts` | Public | The named default, 18. The safety factor default is the shared `DEFAULT_SAFETY_FACTOR`. |
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

The threshold of a rung can be negative for ladders with many rungs or with close bitrates. The selector clamps it to 0. Then the lowest rungs cannot be selected from the buffer level. The RFC lists this as an open question.

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
| The ladder copy and the buffer target | The inputs of the last rebuild. |

A call to `select` runs these steps:

1. Compare the ladder and the buffer target with the stored copies. On a difference, validate and build the new values. See the next section.
2. Sanitize `bufferLevel` and `throughput`.
3. If the ladder has one distinct rung, return its highest index with a delay of 0.
4. In the startup state, pick the rung from the throughput and apply the starvation guard. Then set the placeholder and test the move to steady.
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

The BOLA paper gives a download abandonment heuristic for BOLA-FINITE in section IV.D and Fig. 7. The player abandons a segment at level `m`. The player then downloads the segment at the level below `m` with the best score. The next decision compares with the bandwidth and the level of that download. The selector follows that order, so the replacement becomes the current rung. dash.js sets the current representation to the replacement rung and caps at the minimum buffer of that rung. The abandon rule of dash.js picks the replacement from the throughput. The selector input has no replacement rung, so the selector assumes the next lower rung. In the paper, that level wins while the effective buffer is at or above the threshold of that level.

### Starvation guard

The guard is the starvation guard of the throughput selector, applied to the BOLA pick. The download time of a rung is `bandwidth * segmentDuration / (throughput * safetyFactor)`. The budget is `bufferLevel / playbackRate`. The first pass keeps the highest rung, at or below the pick, within the budget. The second pass adds `min(segmentDuration, starvationTolerance)` to the budget. Rung 0 always passes.

The guard runs after the oscillation guard, so a lowered pick is the current rung. When the guard lowers the pick, the selector skips the delay step. A wait would drain a buffer that the guard found too short for the download.

The cap of `InsufficientBufferRule` in dash.js is `bandwidth <= safeThroughput * bufferLevel / segmentDuration`. That inequality is the first pass with a budget of `bufferLevel`. dash.js runs the rule next to BOLA by default. The smoke test of the implementation PR had the rule active in both players.

The startup state maps these throughputs to these rungs:

| Throughput | 250 kbps | 340 kbps | 850 kbps | 1 Mbps | 3.3 Mbps | 3.4 Mbps | 10 Mbps |
|---|---|---|---|---|---|---|---|
| Rung | 0 | 0 | 1 | 1 | 2 | 3 | 4 |

## Ladder changes

### Why the conversion keeps the decision

A rung switch point depends only on `theta` and on the two neighbouring bitrates. It does not depend on `V` or on the other rungs. A rebuild changes `V` and `ln(b_0)`. It does not change what `theta` means for a given pair of neighbours. Suppose the selector keeps `theta` and recomputes `Q`. Then the decision for the same situation stays the same, except where the change added or removed rungs.

The conversion runs after the selector adds the elapsed time, so `Q_old` includes the wait. A conversion before that step would scale the placeholder and not the wait. The pick could then change. For L1 and a target change from 18 s to 40 s, the error is twice the elapsed time.

The [RFC](./index.md) gives the conversion formulas under Ladder changes.

The conversion is exact when `Q_new` is at least the real buffer level. If `Q_new` is lower, the placeholder is 0 and the real buffer decides.

### Measured effect

Take a change of the buffer target from 18 s to 40 s on L1. The selector can keep the placeholder unchanged. Then the decision changes for 62% of the buffer levels between 0 s and 30 s. With the conversion, no decision changes. The grid has 2,401 levels and no elapsed time. The selector adds the elapsed time before the conversion, so the result applies to any wait.

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

A ladder with one distinct rung makes no BOLA decision. When the ladder gains a second distinct rung, or loses all but one, the selector returns to the startup state with no placeholder. This case has no buffer-based decision to preserve.

## Validation messages

Validation runs on a rebuild only. Each message names the parameter, the expected value, and the received value. Examples:

```
Invalid ladder: expected a positive finite bandwidth at 1, received NaN
Invalid ladder: expected ascending bandwidth, received 750000 at 0 and 300000 at 1
Invalid bufferTarget: expected a positive finite number of seconds, received -3
```

An error leaves the selector state unchanged. The selector validates and builds the new values before it replaces the old ones.
