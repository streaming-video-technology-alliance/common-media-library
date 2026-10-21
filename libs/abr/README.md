# @svta/cml-abr

Bitrate selection functionality.

The package defines `BitrateSelector`, the type that every bitrate selection algorithm implements. A selector takes a bitrate ladder, the buffer level, and a throughput estimate. It returns one index into the ladder. The package ships `createThroughputSelector`, which creates a rate-based selector. That selector picks the highest rung that the throughput estimate sustains.

The package implements the [bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526). Every export is marked `@beta` until a second selector ships.

## When to use

- Pick a bitrate ladder rung from a throughput estimate and the buffer level: `createThroughputSelector`
- Implement a custom bitrate selection algorithm behind the shared interface: `BitrateSelector`, `BitrateSelectorInput`, `BitrateDecision`
- Feed segment download samples to a selector: `SegmentSample`
- Tune the safety factor, the upgrade factor, and the starvation tolerance: `ThroughputSelectorOptions`, `DEFAULT_SAFETY_FACTOR`

Do not write your own rung selection, hysteresis, or starvation guard. Open an issue for a selector type that is missing.

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

## References

- [Bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526)
- [hls.js `AbrController`](https://github.com/video-dev/hls.js/blob/master/src/controller/abr-controller.ts)
- [dash.js `ThroughputRule`](https://github.com/Dash-Industry-Forum/dash.js/blob/development/src/streaming/rules/abr/ThroughputRule.js)
- [shaka-player `AbrManager`](https://github.com/shaka-project/shaka-player/blob/main/externs/shaka/abr_manager.js)
