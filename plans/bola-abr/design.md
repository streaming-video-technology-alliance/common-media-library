# BOLA selector design

This record holds the design details behind the [RFC](../../rfc/bola-abr-selector.md). The RFC defines the public contract. This record explains the derivations, the internal structure, and the measured effect of the ladder change policy. The [analysis](analysis.md) holds the evidence for the choices.

## Goals and non-goals

Goals:

- A selector that has no player dependency and no hidden clock.
- The same decisions as dash.js where the dash.js rule is correct.
- A defined behavior for every change of the ladder or the buffer target.
- Every export carries TSDoc, and every public behavior has a test.

Non-goals for v1:

- Throughput estimation. The caller supplies a number.
- A hybrid selector that switches between a rate-based rule and BOLA.
- A real-buffer guard and an abandon-decision rule.
- Variable segment sizes. The selector uses the bitrate of a rung as its size.

## Structure

The package has two layers. The internal functions are pure and carry the math. `BolaSelector` holds the state and calls them. One file holds one export or one internal function.

| File | Layer | Role |
|---|---|---|
| `createBolaParams.ts` | Internal | Turns a ladder and a buffer target into the thresholds, the maximum buffers, and `V`. |
| `validateLadder.ts` | Internal | Throws a `RangeError` for an invalid ladder. |
| `isSameLadder.ts` | Internal | Compares a ladder with a stored copy, with no allocation. |
| `selectRungByBuffer.ts` | Internal | Returns the highest rung with a threshold at or below the effective buffer. |
| `selectRungByThroughput.ts` | Internal | Returns the highest rung at or below a bitrate. |
| `remapEffectiveBuffer.ts` | Internal | Converts the effective buffer between two parameter sets. |
| `MINIMUM_BUFFER_S.ts`, `MINIMUM_BUFFER_PER_RUNG_S.ts`, `PLACEHOLDER_DECAY.ts` | Internal | Named constants, 10, 2, and 0.99. |
| `BOLA_DEFAULT_BUFFER_TARGET_S.ts`, `BOLA_DEFAULT_THROUGHPUT_SAFETY_FACTOR.ts` | Public | Named defaults, 18 and 0.9. |
| `BolaState.ts` and the four type files | Public | The state and the types in the RFC export surface. |
| `BolaSelector.ts` | Public | The selector class. |

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

At startup the selector picks rung `q` from the throughput and sets the placeholder to `max(0, threshold_q - bufferLevelS)`. The effective buffer is then at least `threshold_q`. The first steady-state call selects rung `q` or higher, and the oscillation guard then limits the rise.

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
| `currentBitrate` | The bitrate of the last rung loaded or selected. The selector stores a bitrate, not an index. |
| `lastSegmentDurationS` | The duration of the last loaded segment. Unknown until the first segment. |
| `lastSegmentEndMs`, `lastCallMs` | The time bases for the wall-clock part of the placeholder. |
| The ladder copy and the buffer target | The inputs of the last rebuild. |

A call to `select` runs these steps:

1. Compare the ladder and the buffer target with the stored copies. On a difference, validate and rebuild. See the next section.
2. Sanitize `bufferLevelS` and `throughputBps`.
3. If the ladder has one distinct rung, return its highest index with a delay of 0.
4. In the startup state, pick the rung from the throughput, set the placeholder, and test the move to steady.
5. In the steady state, add the elapsed time to the placeholder and select the rung for the effective buffer. Then apply the oscillation guard and compute the delay.

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

The startup state maps these throughputs to these rungs:

| Throughput | 250 kbps | 340 kbps | 850 kbps | 1 Mbps | 3.3 Mbps | 3.4 Mbps | 10 Mbps |
|---|---|---|---|---|---|---|---|
| Rung | 0 | 0 | 1 | 1 | 2 | 3 | 4 |

## Ladder changes

### Why the conversion keeps the decision

A rung switch point depends only on `theta` and on the two neighbouring bitrates. It does not depend on `V` or on the other rungs. A rebuild changes `V` and `ln(b_0)`. It does not change what `theta` means for a given pair of neighbours. Suppose the selector keeps `theta` and recomputes `Q`. Then the decision for the same situation stays the same, except where rungs were added or removed.

```
theta        = (Q_old - 10) / V_old + ln(b_0_old)
Q_new        = 10 + V_new * (theta - ln(b_0_new))
placeholder  = max(0, Q_new - bufferLevelS)
```

The conversion is exact when `Q_new` is at least the real buffer level. If `Q_new` is lower, the placeholder floors at 0 and the real buffer decides.

### Measured effect

Take a change of the buffer target from 20 s to 40 s on L1. The selector can keep the placeholder unchanged. Then the decision changes for 62% of the buffer levels between 0 s and 30 s. With the conversion, no decision changes. The grid has 2,401 levels.

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

dash.js resets all state when the minimum bitrate, the maximum bitrate, or the video size changes. The selector returns to startup and picks from the throughput. This discards what the buffer says. The conversion keeps it. A caller that prefers the dash.js behavior can call `reset`.

### Change of the number of distinct rungs

A ladder with one distinct rung makes no BOLA decision. When the ladder gains a second distinct rung, or loses all but one, the selector returns to the startup state with no placeholder. This case has no buffer-based decision to preserve.

## Validation messages

Validation runs on a rebuild only. Each message names the parameter, the expected value, and the received value. Examples:

```
ladderBps[1] must be a positive finite number of bits per second, received NaN
ladderBps must be in ascending order, but ladderBps[1] (300000) is lower than ladderBps[0] (750000)
bufferTargetS must be a positive finite number of seconds, received -3
```

An error leaves the selector state unchanged. The selector validates and builds the new values before it replaces the old ones.
