---
status: accepted
---

# RFC: Bitrate selector type and default selector (`@svta/cml-abr`)

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-10-12 |
| **Package** | `@svta/cml-abr` (new) |
| **Breaking change** | No (new package) |

## Summary

This RFC proposes a new package, `@svta/cml-abr`, for bitrate selection. The package defines one type, `BitrateSelector`, that every selection algorithm implements. It ships one default implementation, created by `createThroughputSelector`. That selector picks the highest rung that the throughput estimate sustains. A selector takes a bitrate ladder, the buffer level, and a throughput estimate. It returns one index into the ladder.

The type follows the `ThroughputEstimator` pattern of `@svta/cml-throughput`. A player feeds every finished download into a selector with `sample` and asks for the next rung with `select`. The [BOLA RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/505) proposes the second implementation.

```ts
import { createThroughputSelector } from '@svta/cml-abr'

const selector = createThroughputSelector()
const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }]

const { index } = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 })
// index is 2. The highest rung at or below 0.9 * 3 Mbps is 1.5 Mbps.
```

## Motivation

CML ships four throughput estimators and no code that turns an estimate into a rung. Every player implements that step itself. Each of hls.js, dash.js, and shaka-player has a rate-based rule with its own safety factors and hysteresis. The rules differ in details that adopters cannot compare.

Two proposals need a shared contract before either can ship:

- Issue 358 and the BOLA RFC propose a buffer-based selector. Its inputs and events differ from a rate-based rule.
- dash.js runs a hybrid strategy. It uses the throughput rule below a buffer level and BOLA above it. A hybrid selector in CML needs two children with one type.

Without a common type, each selector defines its own inputs, and a player must wire each one differently. With the type, a player wires one selector and swaps the algorithm.

## Guide-level explanation

A player creates one estimator and one selector for each media type. A player with one shared estimator passes the same estimate to both selectors. Before every segment request, the player calls `select`. After every finished download, the player calls `sample` on the estimator and on the selector with the same timing object.

```ts
import { createThroughputSelector } from '@svta/cml-abr'
import { EwmaEstimator } from '@svta/cml-throughput'

const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }]
const estimator = new EwmaEstimator({ fastHalfLife: 3, slowHalfLife: 9, defaultEstimate: 1_000_000 })
const selector = createThroughputSelector()

// First request. The estimate is the 1 Mbps default, so the selector picks rung 1 (750 kbps).
const first = selector.select({ ladder, bufferLevel: 0, throughput: estimator.getEstimate(), now: 0 })

// The player downloads a 4 second segment of rung 1 (375,000 bytes) in 500 ms, at 6 Mbps.
const timing = { startTime: 0, encodedBodySize: 375_000, duration: 500 }
estimator.sample(timing)
selector.sample({ timing, bandwidth: ladder[first.index].bandwidth, duration: 4, bufferLevel: 0 })

// Second request. The estimate is about 2.7 Mbps, so the selector picks rung 2 (1.5 Mbps).
const second = selector.select({ ladder, bufferLevel: 4, throughput: estimator.getEstimate(), now: 500, segmentDuration: 4 })
```

The player follows these rules:

- `index` is a position in the `ladder` array of the same call. The player sorts the ladder by `bandwidth` in ascending order and removes the rungs it cannot play before the call.
- Pass the declared peak bandwidth of each rung: `BANDWIDTH` in HLS and `@bandwidth` in DASH.
- Call `select` once per request. A second call before the request replaces the first decision.
- If the chosen rung is unavailable, remove it from the ladder and call `select` again.
- `delay` is the time in seconds to wait before the next request. The throughput selector always returns 0. A player that cannot wait may ignore the value.
- Call `sample` for every finished download, and for every abandoned download with `aborted: true`. The `bandwidth` of the sample is the same number as the ladder entry of the requested rung, never a measured rate. Whether an aborted download produces an estimator sample is the contract of `ThroughputEstimator`, not of the selector.
- Call `reset` after a seek or a source change.

## Reference-level explanation

### Export surface

All types use `type`. Names have no unit suffix. The unit of every field is in its TSDoc, as in the other packages. Bitrates are in bits per second, buffer and segment values in seconds, and clocks in milliseconds.

```ts
export type LadderRung = {
	bandwidth: number              // bits per second, the declared peak rate of the rung
}

export type BitrateSelectorInput = {
	ladder: readonly LadderRung[]  // ascending by bandwidth, filtered by the player
	bufferLevel: number            // seconds of media ahead of the playhead
	throughput: number             // bits per second, NaN when unknown
	now: number                    // milliseconds, same clock as ResourceTiming.startTime
	bufferTarget?: number          // seconds, the buffer level the player aims for
	segmentDuration?: number       // seconds, the media duration of the next segment
	playbackRate?: number          // @defaultValue 1
}

export type BitrateDecision = {
	readonly index: number         // position in the ladder of the same call
	readonly delay: number         // seconds to wait before the next request, 0 or more
}

export type SegmentSample = {
	timing: ResourceTiming         // the object the estimator received
	bandwidth: number              // the bandwidth of the requested rung, equal to its ladder entry
	duration: number               // seconds of media in the segment
	bufferLevel: number            // seconds, at response end, before the segment is appended
	isReplacement?: boolean        // the segment replaced buffered media
	aborted?: boolean              // the player cancelled the download
}

export type BitrateSelector = {
	select(input: BitrateSelectorInput): BitrateDecision
	sample(segment: SegmentSample): void
	reset(): void
}

export type ThroughputSelectorOptions = {
	safetyFactor?: number          // @defaultValue DEFAULT_SAFETY_FACTOR
	upgradeFactor?: number         // @defaultValue DEFAULT_UPGRADE_FACTOR
	starvationTolerance?: number   // seconds, @defaultValue DEFAULT_STARVATION_TOLERANCE
}

export function createThroughputSelector(options?: ThroughputSelectorOptions): BitrateSelector
```

The package also exports `DEFAULT_SAFETY_FACTOR` (0.9), `DEFAULT_UPGRADE_FACTOR` (0.7), and `DEFAULT_STARVATION_TOLERANCE` (4 seconds). The only peer dependency is `@svta/cml-utils`, imported with `import type` for `ResourceTiming`. The package does not import `@svta/cml-throughput`.

### Contract of the type

| Member | Contract |
|---|---|
| `select` | Returns one index into `ladder` and a delay. The player calls it once per request. A second call before the request replaces the first decision. A selector may change its state in this call. |
| `sample` | Records a finished or abandoned download. The player passes the `ResourceTiming` object it gave the estimator. A selector that needs the current rung reads `bandwidth`. |
| `reset` | Returns the selector to its initial state. The player calls it after a seek or a source change. |

A selector reads the fields it needs and ignores the rest. A selector that needs an optional field and does not receive it uses a documented default. A selector that keeps a current rung stores its bandwidth, not its index. In each `select` call, the selector maps that bandwidth to the highest rung at or below it in the ladder of the call. When no rung is at or below it, the current rung is rung 0. This rule keeps the current rung defined when the player removes a rung from the ladder. A hybrid, a wrapper, or the player may load a rung other than the decision. The bandwidth in `sample` is then authoritative. A selector corrects its current rung and its derived state from that bandwidth. There is no stall notification. A selector that reacts to stalls derives them from `bufferLevel` in `select` and `sample`.

The decision is one index, not a ranked list. When a rung fails, the player removes it from the ladder and calls `select` again. See Rationale and alternatives.

### Input validation

| Input | Behavior |
|---|---|
| `ladder` empty | Throws a `RangeError` that names the parameter. |
| `ladder` not in ascending order of `bandwidth` | Throws a `RangeError` with both positions and values. The index refers to the player array, so the selector cannot sort it. |
| An entry whose `bandwidth` is not a positive finite number | Throws a `RangeError` with the position and the value. |
| Equal neighbouring `bandwidth` values | Accepted. The highest index wins. |
| `throughput` not a positive finite number | Treated as unknown. |
| `bufferLevel` not finite or negative | Treated as 0. |
| `playbackRate` not a positive finite number | Treated as 1. |

`createThroughputSelector` validates its options before it stores them. Equal factors are accepted and disable the hysteresis.

| Option | Behavior |
|---|---|
| `safetyFactor` not a finite number above 0 and at most 1 | Throws a `RangeError` that names the option, the expected range, and the received value. |
| `upgradeFactor` not a finite number above 0 and at most 1 | Throws the same `RangeError`. |
| `upgradeFactor` above `safetyFactor` | Throws a `RangeError` with both values. An upgrade must need at least the margin of a downgrade. With a larger upgrade factor, an upgrade could pass the safe pick, and the next call would undo it. |
| `starvationTolerance` not a finite number of 0 or more | Throws the same `RangeError`. |

### Throughput selector

The selector divides the throughput by `playbackRate` to get the effective throughput. It picks the highest rung at or below the safe throughput, which is `effectiveThroughput * safetyFactor`. When no rung is at or below the safe throughput, the pick is rung 0. The same fallback applies to the upgrade pick below. Two rules refine the pick:

- **Hysteresis.** An upgrade needs a larger margin than a downgrade. If the pick is above the current rung, the selector recomputes the pick with `effectiveThroughput * upgradeFactor`. It then returns the higher of the current rung and that pick. The current rung is the bandwidth of the last `sample` that was not aborted, mapped into the ladder of the call as the contract states.
- **Starvation guard.** The guard runs when the player passes `segmentDuration`. The selector estimates the download time of a rung as `bandwidth * segmentDuration / (throughput * safetyFactor)`, with the network throughput and not the effective throughput. The first pass keeps the highest rung, at or below the pick, whose download time is within `bufferLevel / playbackRate`. If no rung passes, the second pass adds `min(segmentDuration, starvationTolerance)` to that budget and keeps the highest rung within it. Rung 0 passes the second pass in every case. A live player omits `segmentDuration` to skip the guard, as hls.js skips the check near the live edge.

When the throughput is unknown, the selector returns the current rung, or rung 0 before the first sample. The delay is always 0.

The playback rate changes the pick before the hysteresis and the guard run:

| Playback rate | Throughput | Effective throughput | Pick |
|---|---|---|---|
| 1 | 5 Mbps | 5 Mbps | 3 Mbps |
| 2 | 5 Mbps | 2.5 Mbps | 1.5 Mbps |

With the ladder of the guide and a current rung of 1.5 Mbps, the hysteresis gives these picks:

| Throughput | 1.6 Mbps | 1.7 Mbps | 4.2 Mbps | 4.3 Mbps | 8.6 Mbps |
|---|---|---|---|---|---|
| Rung | 750 kbps | 1.5 Mbps | 1.5 Mbps | 3 Mbps | 6 Mbps |

The downgrade happens when the safe throughput falls below the current rung, at 1.67 Mbps. The upgrade to 3 Mbps needs `3 / 0.7`, which is 4.29 Mbps.

With a current rung of 6 Mbps, a throughput of 6 Mbps, and 4 second segments, the guard gives these picks:

| Buffer level | 8 s | 1.5 s | 0.5 s | 0.1 s | 0 s |
|---|---|---|---|---|---|
| Rung | 3 Mbps | 1.5 Mbps | 300 kbps | 3 Mbps | 3 Mbps |

The safe throughput of 5.4 Mbps does not sustain the 6 Mbps rung, so the pick starts at 3 Mbps. That rung downloads in 2.2 s and fails the first pass below that buffer level. Below 0.2 s no rung passes the first pass, and the second pass allows 4 s more. The step from 300 kbps to 3 Mbps is the policy of the two passes. The first pass avoids a stall when any rung can. The second pass takes the best rung within the tolerance.

The defaults follow the players:

| Setting | CML default | hls.js | shaka-player | dash.js |
|---|---|---|---|---|
| Safety factor | 0.9 | 0.95 (`abrBandWidthFactor`) | 0.95 (`bandwidthDowngradeTarget`) | 0.9 (`bandwidthSafetyFactor`) |
| Upgrade factor | 0.7 | 0.7 (`abrBandWidthUpFactor`) | 0.85 (`bandwidthUpgradeTarget`) | none |
| Starvation guard | two passes | two passes | no | separate rule |
| Starvation tolerance | 4 s | 4 s (`maxStarvationDelay`) | none | none |
| Minimum switch interval | none | none | 8 s (`switchInterval`) | none |

The shaka-player targets are band edges around each rung and do not depend on the current rung. Its hysteresis is the switch interval.

### Bundle and performance impact

Each file contains one export, so a player that imports only the type adds no runtime code. `select` scans the ladder in O(N) and allocates only the returned decision. `sample` stores one number. The implementation PR will report the minified size.

### Packaging

The scaffold follows `libs/error-codes`. The version starts at 0.0.1. Every export is marked `@beta` until a second selector ships, as `@svta/cml-content-steering` does. The root build script includes the package. `scripts/projects.ts` does not list it until the first release-prep PR.

## Drawbacks

- A new package adds release work. The first publish needs the manual steps from `AGENTS.md`.
- The input type is a superset. Fields that one selector needs are noise for another. The alternative, one input type per selector, removes the common type.
- The player owns the sort, the filter, and the index mapping. That is one more step than passing its own level objects.
- The type fixes the inbound surface to `select`, `sample`, and `reset`. A selector that needs another signal must derive it from the inputs or wait for a type change.

## Rationale and alternatives

- **A new package** (chosen) over a class in `@svta/cml-throughput`. The `ThroughputEstimator` contract has two members, and neither includes a buffer level. A dash.js maintainer asked for a clear separation between throughput calculation and ABR algorithms. The selector has no runtime import from the throughput package. Tree-shaking is equal in both options, because CML exports one file per symbol.
- **`sample`** over `onSegmentLoaded`. In CML the `on` prefix marks a callback that the library invokes, such as `onReport` in `@svta/cml-cmcd`. Inbound methods on stateful objects are imperative verbs. `sample` is the verb the estimators use, and the player calls both at the same moment.
- **One `sample` with an `aborted` flag** over separate abandon and stall methods. An abandoned download is a segment request the player cancelled, with known timing. A stall is visible in `bufferLevel`. The dash.js buffer-empty event is itself defined as a buffer level at or below a threshold.
- **One index** over a ranked list. A list cannot encode the constraints a player applies when a rung fails. For a fallback, hls.js skips penalized levels, other codec sets, other audio groups, and GAP tags. A stateful selector cannot give a consistent second choice, because the delay and the hysteresis belong to the chosen rung. For both known algorithms, a second `select` with the rung removed gives the same answer as the next entry of a list. All three players filter first and then choose.
- **Plain names with units in TSDoc** over unit suffixes. The other packages name `duration`, `timeout`, `interval`, and `ttl` without a suffix. The only suffixes in the public API are `Bytes` and one `Bps`.
- **An object ladder** over an array of numbers. A change from numbers to objects later would break every caller, while a new optional field on `LadderRung` breaks nothing. Selectors read more than the peak rate. hls.js switches to the average bandwidth when the buffer holds two segments. The HLS `SCORE` attribute ranks rungs of equal bandwidth. Planning selectors need segment sizes. The field is `bandwidth` because HLS, DASH, shaka-player, and the cmaf-ham `Track` type all use that name. A dash.js or shaka-player array therefore passes without a mapping step. The sample names its rung by `bandwidth` and not by object reference, because a value survives a ladder rebuild.
- **A `ResourceTiming` in the sample** over separate timing fields. The player already builds the object for the estimator. A selector that needs the request start and end reads `startTime` and `duration`.
- **An injected clock** over reading `performance.now()` inside `select`. BOLA adds the wall-clock time since the last segment ended to its placeholder, so `now` and `timing.startTime` must come from one clock. In hls.js the timings carry `performance.now()` values, dash.js uses `Date` objects, and shaka-player mixes both. Only the player knows which clock its samples use. An injected clock also keeps time out of the hidden state, so tests and simulations drive it. It keeps the package free of environment globals as well. The estimators follow the same rule: they take a `ResourceTiming` and do not measure time.
- **One writer `update(event)`** with a discriminated union was considered. It extends without a type change. It costs a discriminant on every event and loses the `sample` parallel. It remains an option if seek or playback rate events appear.
- **A factory function** over a class. `createThroughputSelector` returns the type and nothing else. The API report shows no private members, and no adopter can subclass a selector and depend on its internals. The factory is also smaller than a class with the same logic by 104 B minified. After gzip the difference is 27 B. The throughput estimators are classes, and the newer `createCmcdSession` and `createSteeringEngine` are factories. The selectors follow the newer pattern.

## Prior art

- `ThroughputEstimator` in `@svta/cml-throughput` is the in-repo model: `sample` in, `getEstimate` out, four interchangeable implementations.
- [shaka-player `AbrManager`](https://github.com/shaka-project/shaka-player/blob/main/externs/shaka/abr_manager.js) is the one pluggable ABR interface in a major player. `chooseVariant` returns one variant. `segmentDownloaded` reports each download. The player filters the variants and calls `setVariants` again when the set changes.
- [hls.js `AbrController`](https://github.com/video-dev/hls.js/blob/master/src/controller/abr-controller.ts) picks with separate up and down factors and a time-to-starvation check. It is the source of the guard and the upgrade factor.
- [dash.js `ThroughputRule`](https://github.com/Dash-Industry-Forum/dash.js/blob/development/src/streaming/rules/abr/ThroughputRule.js) picks the highest representation at or below the safe throughput. The dash.js default strategy combines it with BOLA by buffer level.
- The [BOLA RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/505) is the second implementation and the source of the ladder and buffer semantics.

## Unresolved questions

1. **Upgrade factor.** hls.js uses 0.7 for the same rule, and it is the only like-for-like reference. The shaka-player 0.85 is a band edge, not a hysteresis factor. Does 0.7 stand?
2. **Starvation guard placement.** Should the guard live in the throughput selector, or in a wrapper that any selector can use? dash.js keeps it in a separate rule.
3. **Startup floor.** Resolved in v8. The second pass of the guard adds `min(segmentDuration, starvationTolerance)` to the budget. The tolerance is an option with a default of 4 s.
4. **Minimum switch interval.** shaka-player blocks switches for 8 s after a switch. Should the throughput selector offer that option?
5. **`bufferTarget` placement.** The draft puts it in the input, so a player can change it during playback. Should it be a constructor option instead?
6. **Release tag.** `@beta` until the second selector ships, or `@public` from the first release?
7. **Package name.** `@svta/cml-abr` names the family. Do the maintainers prefer another name?

## Future possibilities

- The BOLA selector from the BOLA RFC, as the second implementation.
- A hybrid selector that runs one child below a buffer level and another above it, as dash.js does.
- Optional inputs for low-latency selectors: `latency` and `targetLatency`.
- Optional `LadderRung` fields: `averageBandwidth`, `score`, `qualityRanking`, and segment sizes for selectors that plan over a horizon.
- A real-buffer guard that any selector can wrap.

## Revision history

- v1 (2026-10-12): initial draft.
- v2 (2026-10-12): review feedback. The constructor options have a validity contract, and the current rung maps into the ladder of each call.
- v3 (2026-10-12): review feedback. The pick divides the throughput by the playback rate, and rung 0 is the pick when no rung fits.
- v4 (2026-10-12): the bitrate in `sample` is authoritative when a composer or the player loads a rung other than the decision.
- v5 (2026-10-12): the option bounds are written in words, and the upgrade factor rule states its reason.
- v6 (2026-10-13): the default selector is a factory function, `createThroughputSelector`, not a class.
- v7 (2026-10-13): the ladder is an array of `LadderRung` objects with `bandwidth`, and the sample names its rung by `bandwidth`.
- v8 (2026-10-13): review feedback from the BOLA RFC author. The contract states the call rules. The starvation guard has two passes and a tolerance option. The ladder rows cover entry values and equal neighbours, and the guide names the bandwidth to pass. The prior-art notes separate the shaka-player bands from the hysteresis.
- v9 (2026-10-13): the rationale explains the injected clock.
- v10 (2026-10-14): status set to `accepted`.

## Final Decision

Accepted on 2026-10-14. The RFC PR #526 carries the export surface above as the contract. The implementation PR #529 follows the draft on the open questions:

- an upgrade factor of 0.7
- the starvation guard inside the throughput selector
- no minimum switch interval
- `bufferTarget` in the input
- `@beta` on every export
- the package name `@svta/cml-abr`

The BOLA RFC #505 is the second implementation of the type.
