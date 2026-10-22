<!-- libs/abr/README.md -->
# @svta/cml-abr

Bitrate selection functionality.

The package defines `BitrateSelector`, the type that every bitrate selection algorithm implements. A selector takes a bitrate ladder, the buffer level, and a throughput estimate. It returns one index into the ladder. The package ships two selectors. `createThroughputSelector` creates a rate-based selector that picks the highest rung that the throughput estimate sustains. `createBolaSelector` creates a buffer-based selector that implements BOLA.

The package implements the [bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526) and the [BOLA selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/rfc/bola-abr-selector/index.md). Every export is marked `@beta`.

## When to use

- Pick a bitrate ladder rung from a throughput estimate and the buffer level: `createThroughputSelector`
- Pick a rung from the buffer level with BOLA, and tune its safety factors: `createBolaSelector`, `BolaSelectorOptions`
- Implement a custom bitrate selection algorithm behind the shared interface: `BitrateSelector`, `BitrateSelectorInput`, `BitrateDecision`
- Pass segment download samples to a selector: `SegmentSample`
- Tune the safety factor, the upgrade factor, and the starvation tolerance: `ThroughputSelectorOptions`, `DEFAULT_SAFETY_FACTOR`

Do not rewrite the rate-based or BOLA selectors. For a different algorithm, implement `BitrateSelector`. Open an issue for a selector type that is missing.

## Installation

```bash
npm i @svta/cml-abr
```

The package has one peer dependency, `@svta/cml-utils`. The package imports it only with `import type`, so nothing from it appears in the runtime output.

## Usage

```typescript
import { createThroughputSelector } from "@svta/cml-abr";

const selector = createThroughputSelector();
const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }];

const { index } = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 });

console.log(index);
// 2. The highest rung at or below 0.9 * 3 Mbps is 1.5 Mbps.
```

## Player integration

A player creates one estimator and one selector for each media type. A player with one shared estimator passes the same estimate to both selectors. Before every segment request, the player calls `select`. After every finished download, the player calls `sample` on the estimator and on the selector with the same timing object.

```typescript
import { createThroughputSelector } from "@svta/cml-abr";
import { EwmaEstimator } from "@svta/cml-throughput";

const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }];
const estimator = new EwmaEstimator({ fastHalfLife: 3, slowHalfLife: 9, defaultEstimate: 1_000_000 });
const selector = createThroughputSelector();

// First request. The estimate is the 1 Mbps default, so the selector picks rung 1 (750 kbps).
const first = selector.select({ ladder, bufferLevel: 0, throughput: estimator.getEstimate(), now: 0 });

// The player downloads a 4 second segment of rung 1 (375,000 bytes) in 500 ms, at 6 Mbps.
const timing = { startTime: 0, encodedBodySize: 375_000, duration: 500 };
estimator.sample(timing);
selector.sample({ timing, bandwidth: ladder[first.index].bandwidth, duration: 4, bufferLevel: 0 });

// Second request. The estimate is about 2.7 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladder, bufferLevel: 4, throughput: estimator.getEstimate(), now: 500, segmentDuration: 4 });
```

The player follows these rules:

- `index` is a position in the `ladder` array of the same call. The player sorts the ladder by `bandwidth` in ascending order and removes the rungs it cannot play before the call.
- Pass the declared peak bandwidth of each rung: `BANDWIDTH` in HLS and `@bandwidth` in DASH.
- Call `select` after the `sample` of the previous segment and before the next request, not during a download. A second call before the request replaces the first decision.
- If the chosen rung is unavailable, remove it from the ladder and call `select` again.
- `delay` is the time in seconds to wait before the next request. The throughput selector always returns 0. A player that cannot wait may ignore the value. After a delay, call `select` again. The selector accounts for the wait.
- Pass optional fields that configure a selector, such as `bufferTarget`, in every call or in none.
- Call `sample` for every finished download, and for every abandoned download with `aborted: true`. The `bandwidth` of the sample is the same number as the ladder entry of the requested rung, never a measured rate. Whether an aborted download produces an estimator sample is the contract of `ThroughputEstimator`, not of the selector.
- Call `reset` after a seek or a source change.

### Input validation

| Input | Behavior |
|---|---|
| `ladder` empty | Throws a `RangeError` that names the parameter. |
| An entry whose `bandwidth` is not a positive finite number | Throws a `RangeError` with the position and the value. |
| `ladder` not in ascending order of `bandwidth` | Throws a `RangeError` with both positions and values. |
| Equal neighbouring `bandwidth` values | Accepted. The highest index wins. |
| `throughput` not a finite number of 0 or more | Treated as unknown. |
| `bufferLevel` not finite or negative | Treated as 0. |
| `playbackRate` not a positive finite number | Treated as 1. |
| `segmentDuration` not a positive finite number | Treated as not passed. |

## Throughput selector

The selector divides the throughput by `playbackRate` to get the effective throughput. It picks the highest rung at or below `effectiveThroughput * safetyFactor`. When no rung is at or below that value, the pick is rung 0. Two rules refine the pick:

- **Hysteresis.** An upgrade needs a larger margin than a downgrade. If the pick is above the current rung, the selector recomputes the pick with `effectiveThroughput * upgradeFactor`. It then returns the higher of the current rung and that pick. The current rung is the bandwidth of the last `sample` that was not aborted. The selector maps that bandwidth to the highest rung at or below it in the ladder of the call. When no rung qualifies, the current rung is rung 0.
- **Starvation guard.** The guard runs when the player passes `segmentDuration`. The selector estimates the download time of a rung as `bandwidth * segmentDuration / (throughput * safetyFactor)`, with the network throughput and not the effective throughput. The first pass keeps the highest rung, at or below the pick, whose download time is within `bufferLevel / playbackRate`. If no rung passes, the second pass adds `min(segmentDuration, starvationTolerance)` to that budget and keeps the highest rung within it. Rung 0 passes the second pass in every case. A live player omits `segmentDuration` to skip the guard, as hls.js skips the check near the live edge.

When the throughput is unknown, the selector returns the current rung, or rung 0 before the first sample. A throughput of 0 is a measurement, so the pick is rung 0. The delay is always 0.

With the ladder of the examples and a current rung of 1.5 Mbps, the hysteresis gives these picks:

| Throughput | 1.6 Mbps | 1.7 Mbps | 4.2 Mbps | 4.3 Mbps | 8.6 Mbps |
|---|---|---|---|---|---|
| Rung | 750 kbps | 1.5 Mbps | 1.5 Mbps | 3 Mbps | 6 Mbps |

The downgrade happens when the safe throughput falls below the current rung, at 1.67 Mbps. The upgrade to 3 Mbps needs `3 / 0.7`, which is 4.29 Mbps.

With a current rung of 6 Mbps, a throughput of 6 Mbps, and 4 second segments, the guard gives these picks:

| Buffer level | 8 s | 1.5 s | 0.5 s | 0.1 s | 0 s |
|---|---|---|---|---|---|
| Rung | 3 Mbps | 1.5 Mbps | 300 kbps | 3 Mbps | 3 Mbps |

The safe throughput of 5.4 Mbps does not sustain the 6 Mbps rung, so the pick starts at 3 Mbps. That rung downloads in 2.2 s and fails the first pass below that buffer level. Below 0.2 s no rung passes the first pass, and the second pass allows 4 s more. The step from 300 kbps to 3 Mbps is the policy of the two passes. The first pass avoids a stall when any rung can. The second pass takes the best rung within the tolerance.

The playback rate changes the pick before the hysteresis and the guard run:

| Playback rate | Throughput | Effective throughput | Pick |
|---|---|---|---|
| 1 | 5 Mbps | 5 Mbps | 3 Mbps |
| 2 | 5 Mbps | 2.5 Mbps | 1.5 Mbps |

### Options

```typescript
import { createThroughputSelector } from "@svta/cml-abr";

const selector = createThroughputSelector({ safetyFactor: 0.95, upgradeFactor: 0.85, starvationTolerance: 2 });
```

| Option | Default | Description |
|---|---|---|
| `safetyFactor` | `DEFAULT_SAFETY_FACTOR` (0.9) | The fraction of the effective throughput that a rung may use. |
| `upgradeFactor` | `DEFAULT_UPGRADE_FACTOR` (0.7) | The fraction of the effective throughput that a higher rung may use. |
| `starvationTolerance` | `DEFAULT_STARVATION_TOLERANCE` (4) | The seconds of stall that the second pass of the guard allows, capped at the segment duration. |

Both factors must be finite numbers above 0 and at most 1. `upgradeFactor` must not exceed `safetyFactor`, because a larger upgrade factor could pass the safe pick and the next call would undo it. Equal factors disable the hysteresis. The tolerance must be a finite number of 0 or more. `createThroughputSelector` throws a `RangeError` for an invalid option.

The defaults follow the players:

| Setting | CML default | hls.js | shaka-player | dash.js |
|---|---|---|---|---|
| Safety factor | 0.9 | 0.95 (`abrBandWidthFactor`) | 0.95 (`bandwidthDowngradeTarget`) | 0.9 (`bandwidthSafetyFactor`) |
| Upgrade factor | 0.7 | 0.7 (`abrBandWidthUpFactor`) | 0.85 (`bandwidthUpgradeTarget`) | none |
| Starvation guard | two passes | two passes | no | separate rule |
| Starvation tolerance | 4 s | 4 s (`maxStarvationDelay`) | none | none |
| Minimum switch interval | none | none | 8 s (`switchInterval`) | none |

The shaka-player targets are band edges around each rung and do not depend on the current rung. Its hysteresis is the switch interval.

## BOLA selector

`createBolaSelector` creates a buffer-based selector. It implements BOLA, the Buffer Occupancy based Lyapunov Algorithm of Spiteri, Urgaonkar, and Sitaraman. A full buffer allows a high rung. A low buffer forces a low rung. The selector needs the throughput estimate at startup and in its two guards.

```typescript
import { createBolaSelector } from "@svta/cml-abr";

const selector = createBolaSelector();
const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }];

// First request. No sample exists and the estimate is unknown, so the selector picks rung 0.
const first = selector.select({ ladder, bufferLevel: 0, throughput: NaN, now: 0 });

// The player downloads a 4 second segment of rung 0 (150,000 bytes) in 400 ms, at 3 Mbps.
const timing = { startTime: 0, encodedBodySize: 150_000, duration: 400 };
selector.sample({ timing, bandwidth: ladder[first.index].bandwidth, duration: 4, bufferLevel: 0 });

// Second request. The estimate is 3 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 400 });

console.log(second.index, second.state);
// 2 steady
```

The decision has the `index` and the `delay` of every selector. It also has the `state` of BOLA and the `placeholder` buffer in seconds. The player follows the shared rules of the [player integration](#player-integration) section. BOLA adds these rules:

- `delay` is positive when the buffer is above the maximum buffer of the chosen rung. The top rung never has a delay. Wait, and call `select` again. The selector adds the wait to its placeholder buffer. If the buffer drained during the wait, the second call returns a delay of 0. If it did not drain, for example in a paused player, the second call returns the delay again. A player that ignores the delay stays at the selected rung until the real buffer passes the next threshold. The cost is lower quality, not a stall.
- `bufferTarget` is the buffer level, in seconds, that the player aims for. A larger value spreads the thresholds over a larger range of buffer levels. The default is `BOLA_DEFAULT_BUFFER_TARGET` (18). Pass the field in every call or in none.
- `segmentDuration` enables the starvation guard. The guard lowers the pick when the download of the next segment does not fit in the real buffer. A live player omits the field to skip the guard, as for the throughput selector.
- A stall needs no call. The selector treats a `bufferLevel` of 0.3 seconds or less as a stall in the steady state.
- A selector that never receives a `sample` stays in the startup state. A `sample` without a positive finite `duration` has the same effect.
- Create one selector for each media type, such as audio and video.
- The BOLA rules ignore `playbackRate`. The starvation guard reads `segmentDuration` and `playbackRate`.

### How it works

BOLA scores each rung with the effective buffer. The effective buffer is the real buffer level plus a placeholder buffer. The placeholder is virtual buffer time. It lets startup and seeks begin at a sustainable rung, not at the lowest rung. The rung with the best score wins. The selector turns this into one threshold for each rung, so a call does not compute scores.

| State | Behavior |
|---|---|
| Startup | Picks the highest rung at or below `throughput * safetyFactor`, or rung 0 when the estimate is unknown. Sets the placeholder so that the effective buffer is at least the threshold of that rung. Moves to the steady state in the first call after a `sample`, when the buffer holds one segment. That call still picks from the throughput. |
| Steady | Adds the wall-clock time since the last request ended to the placeholder. Picks the rung for the effective buffer. Applies the oscillation guard and the starvation guard. Returns a delay when the buffer is above the maximum buffer of the rung. |

The oscillation guard is the BOLA-O variant. Suppose the buffer picks a rung above both the current rung and the rung that the throughput sustains. Then the selector keeps the higher of those two rungs. The guard never forces a downward switch, and it is skipped when the estimate is unknown.

### Starvation guard

The starvation guard is the guard of the throughput selector, with one pass. It runs in the steady state, after the oscillation guard and before the delay. It runs when all of these conditions hold:

- The input has a positive `segmentDuration`.
- The throughput is known.
- Two samples have finished since the last `reset`. An aborted sample does not count.

The guard estimates the download time of a rung as `bandwidth * segmentDuration / (throughput * starvationSafetyFactor)`. It keeps the highest rung, at or below the pick, whose download time is within `bufferLevel / playbackRate`. Rung 0 always passes. The guard never raises a pick. A lowered pick becomes the current rung, and the call returns no delay.

The guard has its own factor. One download varies more than the smoothed estimate, so the default is 0.7 and not 0.9. The guard binds only when the real buffer is low, so the larger margin costs little bitrate.

Take the ladder of the examples, a throughput of 4 Mbps, and 4 second segments. For a pick of 6 Mbps, the guard gives these picks:

| Buffer level | 8 s | 6 s | 3 s | 1.5 s | 0.5 s |
|---|---|---|---|---|---|
| Rung | 3 Mbps | 3 Mbps | 1.5 Mbps | 750 kbps | 300 kbps |

The 3 Mbps rung needs 4.3 s to download at the safe throughput of 2.8 Mbps. It fits in a buffer of 6 s and not in a buffer of 3 s. At 0.5 s only rung 0 fits.

### What `sample` does

The selector reads these fields of a `SegmentSample`:

| Field | Use |
|---|---|
| `bandwidth` | Sets the current rung. For an aborted sample, it locates the aborted rung. The selector ignores a value that is not finite. |
| `timing` | The end of the request, `startTime + duration`, starts the clock of the placeholder. An aborted request ends at the abort. The request `duration` gives the buffer level at the start of the request. |
| `duration` | Moves the selector to the steady state, and sizes the growth for a replacement segment. A value that is not a positive finite number keeps the startup state. |
| `bufferLevel` | Decays and caps the placeholder. In the steady state, 0.3 seconds or less is a stall. |
| `isReplacement` | Adds `duration` to the placeholder. |
| `aborted` | The next lower rung replaces the aborted rung. It becomes the current rung, and its threshold caps the placeholder. When the replacement is rung 0, the cap is 10 seconds. For an abort of rung 0 the current rung stays. The stall rule applies. A finished sample counts for the starvation guard, and an aborted sample does not. |

### Ladder changes

Pass the ladder and the `bufferTarget` in every call. The selector compares them with the values of the last call, and it detects a change made in place. A multi-period stream, a new bitrate limit, or a new video size needs no other call. The player filters the ladder and the selector adapts. In the steady state, the selector adds the elapsed time to the placeholder and then converts its effective buffer. The pick for the same buffer level then stays the same. One case differs. The placeholder cannot be negative. If the conversion needs a negative placeholder, the placeholder is 0 and the real buffer alone decides. A larger `bufferTarget` with a small placeholder causes this. When the ladder gains or loses its second distinct rung, the selector returns to the startup state. It also forgets the duration of the last segment, so it stays in that state until the next `sample`. After a seek or a source change, call `reset`.

### Comparison with the throughput selector

| | Throughput selector | BOLA selector |
|---|---|---|
| Main input | The throughput estimate | The buffer level |
| Throughput estimate | Needed in every call | Needed at startup and in the two guards |
| State | The current rung | The state, the placeholder buffer, and the time bases |
| Delay | Always 0 | Positive above the maximum buffer of the rung |
| Starvation guard | Two passes, with `starvationTolerance` | One pass, with `starvationSafetyFactor` |

A seeded simulation ran both selectors on 100 random throughput traces. Each session has 75 segments of 4 seconds, and the player passes `segmentDuration`. The BOLA selector uses its default options. The ladders are the five rungs of the examples and a ladder of ten rungs from 235 kbps to 5.8 Mbps.

| Ladder and buffer cap | Selector | Average Mbps | Stalls per session | Switches per session |
|---|---|---|---|---|
| 5 rungs, 18 s | BOLA | 1.87 | 0.13 | 5.7 |
| 5 rungs, 18 s | Throughput | 1.28 | 0.03 | 5.3 |
| 10 rungs, 18 s | BOLA | 2.21 | 0.29 | 11.5 |
| 10 rungs, 18 s | Throughput | 1.62 | 0.02 | 10.5 |
| 10 rungs, 30 s | BOLA | 2.30 | 0.16 | 10.4 |
| 10 rungs, 30 s | Throughput | 1.61 | 0.02 | 10.2 |

BOLA picks higher rungs, and its average bitrate is 36% to 47% above the throughput selector. It also stalls more often, even with the starvation guard. Without the guard, BOLA stalls 0.23 to 0.96 times per session in the same runs. A lower `starvationSafetyFactor` trades bitrate for fewer stalls. The model is simple. The numbers compare the selectors under one channel model, and they do not predict a real session.

### Limits

- **Buffer size.** BOLA suits a large buffer. In the [dash.js follow-up paper](https://doi.org/10.1145/3204949.3204953), a throughput rule oscillates less than the original BOLA with a buffer of 10 seconds. The original BOLA has no placeholder buffer and no starvation guard. The selector has both. The dash.js player still runs BOLA only above a buffer level, so a small `bufferTarget` needs care. The selector does not warn about it. A player can combine the selector with a rate-based rule at low buffer levels.
- **Real buffer.** The placeholder adds to the real buffer. BOLA can then pick a rung that the real buffer alone would not sustain. The starvation guard limits this risk when the player passes `segmentDuration`. A player that omits the field owns the stall risk. With the default guard, BOLA still stalls more often than the throughput selector in the simulation above.
- **Lowest rungs.** The formula can give a threshold below 0, and the selector uses 0 instead. Then the buffer rule never picks a rung below the highest rung with a threshold of 0. The rule holds even at an empty buffer. Three cases cause this:
  - A ladder with many rungs. Each distinct rung adds 2 seconds to the smallest buffer time, which is `10 + 2 * M` seconds for `M` rungs. A test ladder of 20 rungs with equal bandwidth ratios never picks its two lowest rungs.
  - A large `bufferTarget`.
  - Two lowest rungs with close bandwidths. A ladder of two rungs with the default `bufferTarget` always picks the upper rung when the bandwidth ratio is 1.8 or less.
- **Playback rate.** The BOLA rules ignore `playbackRate`, as dash.js does. The starvation guard divides the buffer level by it.

### BOLA options

```typescript
import { createBolaSelector } from "@svta/cml-abr";

const selector = createBolaSelector({ safetyFactor: 0.95, starvationSafetyFactor: 0.5 });
```

| Option | Default | Description |
|---|---|---|
| `safetyFactor` | `DEFAULT_SAFETY_FACTOR` (0.9) | The fraction of the throughput that a rung may use. The selector uses it at startup and in the oscillation guard. |
| `starvationSafetyFactor` | `DEFAULT_STARVATION_SAFETY_FACTOR` (0.7) | The fraction of the throughput that the starvation guard assumes for the download of the next segment. |

`safetyFactor` has the bounds of the option with the same name of `createThroughputSelector`. `starvationSafetyFactor` has the same bounds. Each factor must be a finite number above 0 and at most 1. `createBolaSelector` throws a `RangeError` for an invalid value.

### BOLA input validation

The rows of the [input validation](#input-validation) table apply. A ladder with one distinct bandwidth gets that rung and a delay of 0. The state is startup and the placeholder is 0. BOLA adds two rows:

| Input | Behavior |
|---|---|
| `bufferTarget` not a positive finite number | Throws a `RangeError` that names the parameter, the expected value, and the received value. |
| `bufferTarget` below `10 + 2 * M` | Raised to `10 + 2 * M`. |

### Differences from dash.js

The selector follows `BolaRule.js` of dash.js, with these changes:

- The minimum and maximum buffer helpers use the same utility offset as the score. The dash.js helpers differ from the score by `V` seconds.
- The selector reads the ladder in every call and handles a change made in place. The dash.js player builds its state once for each stream and media type.
- The selector indexes everything by position in the player ladder. The dash.js player mixes positions of a filtered list with indices of an unfiltered list.
- `M` counts the distinct bandwidths. dash.js counts the representations.
- An unknown throughput does not block upward switches in the steady state, and it picks rung 0 at startup.
- The selector derives a stall from the buffer level and clears the time bases of the placeholder.
- The player passes the time. dash.js reads `Date.now()`.
- A remainder of one millisecond or less is not a delay.
- After an aborted download, the selector treats the next lower rung as the replacement. The dash.js player uses the rung that its abandon rule picks from the throughput. The selector input has no replacement rung. Both set the current rung to the replacement. Both cap the effective buffer at the threshold of that rung, or at 10 seconds when the replacement is rung 0.
- After a change of the buffer target, the selector adds the elapsed time and then converts the effective buffer. The dash.js player converts first and then adds the elapsed time.
- The starvation guard is part of the selector. The dash.js player runs `InsufficientBufferRule` as a separate rule. It has the same cap, `safeThroughput * bufferLevel / segmentDuration`, the same factor of 0.7, and the same wait of two segments. The dash.js player disables that rule in low-latency mode, and a player of the selector omits `segmentDuration` instead. After a buffer-empty event, the dash.js player drops to rung 0. The selector empties the placeholder, and the guard at an empty buffer allows rung 0 only.

## References

- [Bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526)
- [hls.js `AbrController`](https://github.com/video-dev/hls.js/blob/master/src/controller/abr-controller.ts)
- [BOLA selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/rfc/bola-abr-selector/index.md)
- [BOLA: Near-Optimal Bitrate Adaptation for Online Videos](https://arxiv.org/abs/1601.06748)
- [From Theory to Practice: Improving Bitrate Adaptation in the DASH Reference Player](https://doi.org/10.1145/3204949.3204953)
- [dash.js `BolaRule`](https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/BolaRule.js)
- [dash.js `InsufficientBufferRule`](https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/InsufficientBufferRule.js)
- [dash.js `ThroughputRule`](https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/ThroughputRule.js)
- [shaka-player `AbrManager`](https://github.com/shaka-project/shaka-player/blob/main/externs/shaka/abr_manager.js)

<!-- libs/abr/config/cml-abr.api.md -->
## API Report File for "@svta/cml-abr"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { ResourceTiming } from '@svta/cml-utils';
import { ValueOf } from '@svta/cml-utils';

// @beta
export type BitrateDecision = {
    readonly index: number;
    readonly delay: number;
};

// @beta
export type BitrateSelector = {
    select(input: BitrateSelectorInput): BitrateDecision;
    sample(segment: SegmentSample): void;
    reset(): void;
};

// @beta
export type BitrateSelectorInput = {
    ladder: readonly LadderRung[];
    bufferLevel: number;
    throughput: number;
    now: number;
    bufferTarget?: number;
    segmentDuration?: number;
    playbackRate?: number;
};

// @beta
export const BOLA_DEFAULT_BUFFER_TARGET = 18;

// @beta
export type BolaDecision = BitrateDecision & {
    readonly state: BolaState;
    readonly placeholder: number;
};

// @beta
export type BolaSelector = Omit<BitrateSelector, "select"> & {
    select(input: BitrateSelectorInput): BolaDecision;
};

// @beta
export type BolaSelectorOptions = {
    safetyFactor?: number;
    starvationSafetyFactor?: number;
};

// @beta
export const BolaState: {
    readonly STARTUP: "startup";
    readonly STEADY: "steady";
};

// @beta (undocumented)
export type BolaState = ValueOf<typeof BolaState>;

// @beta
export function createBolaSelector(options?: BolaSelectorOptions): BolaSelector;

// @beta
export function createThroughputSelector(options?: ThroughputSelectorOptions): BitrateSelector;

// @beta
export const DEFAULT_SAFETY_FACTOR = .9;

// @beta
export const DEFAULT_STARVATION_SAFETY_FACTOR = .7;

// @beta
export const DEFAULT_STARVATION_TOLERANCE = 4;

// @beta
export const DEFAULT_UPGRADE_FACTOR = .7;

// @beta
export type LadderRung = {
    bandwidth: number;
};

// @beta
export type SegmentSample = {
    timing: ResourceTiming;
    bandwidth: number;
    duration: number;
    bufferLevel: number;
    isReplacement?: boolean;
    aborted?: boolean;
};

// @beta
export type ThroughputSelectorOptions = {
    safetyFactor?: number;
    upgradeFactor?: number;
    starvationTolerance?: number;
};

// (No @packageDocumentation comment for this package)

```
