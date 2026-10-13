# @svta/cml-abr

Bitrate selection functionality.

The package defines `BitrateSelector`, the type that every bitrate selection algorithm implements. A selector takes a bitrate ladder, the buffer level, and a throughput estimate. It returns one index into the ladder. The package ships `ThroughputSelector`, a rate-based selector. It picks the highest rung that the throughput estimate sustains.

The package implements the [bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526). Every export is marked `@beta` until a second selector ships.

## Installation

```bash
npm i @svta/cml-abr
```

The package has one peer dependency, `@svta/cml-utils`. The package imports it only with `import type`, so nothing from it appears in the runtime output.

## Usage

```typescript
import { ThroughputSelector } from "@svta/cml-abr";

const selector = new ThroughputSelector();
const ladder = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000];

const { index } = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 });

console.log(index);
// 2. The highest rung at or below 0.9 * 3 Mbps is 1.5 Mbps.
```

## Player integration

A player creates one estimator and one selector for each media type. Before every segment request, the player calls `select`. After every finished download, the player calls `sample` on the estimator and on the selector with the same timing object.

```typescript
import { ThroughputSelector } from "@svta/cml-abr";
import { EwmaEstimator } from "@svta/cml-throughput";

const ladder = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000];
const estimator = new EwmaEstimator({ fastHalfLife: 3, slowHalfLife: 9, defaultEstimate: 1_000_000 });
const selector = new ThroughputSelector();

// First request. The estimate is the 1 Mbps default, so the selector picks rung 1 (750 kbps).
const first = selector.select({ ladder, bufferLevel: 0, throughput: estimator.getEstimate(), now: 0 });

// The player downloads a 4 second segment of rung 1 (375,000 bytes) in 500 ms, at 6 Mbps.
const timing = { startTime: 0, encodedBodySize: 375_000, duration: 500 };
estimator.sample(timing);
selector.sample({ timing, bitrate: ladder[first.index], duration: 4, bufferLevel: 0 });

// Second request. The estimate is about 2.7 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladder, bufferLevel: 4, throughput: estimator.getEstimate(), now: 500, segmentDuration: 4 });
```

The player follows these rules:

- `index` is a position in the `ladder` array of the same call. The player sorts the ladder in ascending order and removes the rungs it cannot play before the call.
- Call `select` once per request. A second call before the request replaces the first decision.
- If the chosen rung is unavailable, remove it from the ladder and call `select` again.
- `delay` is the time in seconds to wait before the next request. `ThroughputSelector` always returns 0. A player that cannot wait may ignore the value.
- Call `sample` for every finished download, and for every abandoned download with `aborted: true`.
- Call `reset` after a seek or a source change.

### Input validation

| Input | Behavior |
|---|---|
| `ladder` empty | Throws a `RangeError` that names the parameter. |
| `ladder` not in ascending order | Throws a `RangeError` with both positions and values. Equal adjacent rungs are accepted. |
| `throughput` not a positive finite number | Treated as unknown. |
| `bufferLevel` not finite or negative | Treated as 0. |
| `playbackRate` not a positive finite number | Treated as 1. |
| `segmentDuration` not a positive finite number | Treated as not passed. |

## ThroughputSelector

The selector divides the throughput by `playbackRate` to get the effective throughput. It picks the highest rung at or below `effectiveThroughput * safetyFactor`. When no rung is at or below that value, the pick is rung 0. Two rules refine the pick:

- **Hysteresis.** An upgrade needs a larger margin than a downgrade. If the pick is above the current rung, the selector recomputes the pick with `effectiveThroughput * upgradeFactor`. It then returns the higher of the current rung and that pick. The current rung is the bitrate of the last `sample` that was not aborted. The selector maps that bitrate to the highest rung at or below it in the ladder of the call. When no rung qualifies, the current rung is rung 0.
- **Starvation guard.** The guard runs when the player passes `segmentDuration` and `bufferLevel` is above 0. The selector estimates the download time of the pick as `bitrate * segmentDuration / (throughput * safetyFactor)`. If that time exceeds `bufferLevel / playbackRate`, the selector steps down one rung and checks again. Rung 0 always passes.

When the throughput is unknown, the selector returns the current rung, or rung 0 before the first sample. The delay is always 0.

With the ladder of the examples and a current rung of 1.5 Mbps, the hysteresis gives these picks:

| Throughput | 1.6 Mbps | 1.7 Mbps | 4.2 Mbps | 4.3 Mbps | 8.6 Mbps |
|---|---|---|---|---|---|
| Rung | 750 kbps | 1.5 Mbps | 1.5 Mbps | 3 Mbps | 6 Mbps |

With a current rung of 6 Mbps, a throughput of 6 Mbps, and 4 second segments, the guard gives these picks:

| Buffer level | 8 s | 3 s | 1.5 s | 0.5 s | 0 s |
|---|---|---|---|---|---|
| Rung | 3 Mbps | 3 Mbps | 1.5 Mbps | 300 kbps | 3 Mbps |

### Options

```typescript
import { ThroughputSelector } from "@svta/cml-abr";

const selector = new ThroughputSelector({ safetyFactor: 0.95, upgradeFactor: 0.85 });
```

| Option | Default | Description |
|---|---|---|
| `safetyFactor` | `DEFAULT_SAFETY_FACTOR` (0.9) | The fraction of the throughput estimate that a rung may use. |
| `upgradeFactor` | `DEFAULT_UPGRADE_FACTOR` (0.7) | The fraction of the throughput estimate that a higher rung may use. |

Both factors must be finite numbers in the range (0, 1]. `upgradeFactor` must not exceed `safetyFactor`. Equal factors disable the hysteresis. The constructor throws a `RangeError` for an invalid option.

The defaults follow the players:

| Setting | CML default | hls.js | shaka-player | dash.js |
|---|---|---|---|---|
| Safety factor | 0.9 | 0.95 (`abrBandWidthFactor`) | 0.95 (`bandwidthDowngradeTarget`) | 0.9 (`bandwidthSafetyFactor`) |
| Upgrade factor | 0.7 | 0.7 (`abrBandWidthUpFactor`) | 0.85 (`bandwidthUpgradeTarget`) | none |
| Starvation guard | yes | yes, with a 4 s floor | no | separate rule |

## References

- [Bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526)
- [hls.js `AbrController`](https://github.com/video-dev/hls.js/blob/master/src/controller/abr-controller.ts)
- [dash.js `ThroughputRule`](https://github.com/Dash-Industry-Forum/dash.js/blob/development/src/streaming/rules/abr/ThroughputRule.js)
- [shaka-player `AbrManager`](https://github.com/shaka-project/shaka-player/blob/main/externs/shaka/abr_manager.js)
