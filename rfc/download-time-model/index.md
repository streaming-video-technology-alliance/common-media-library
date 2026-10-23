---
status: draft
---

# RFC: Download-time model for the bitrate selectors (`@svta/cml-abr`)

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-10-23 |
| **Package** | `@svta/cml-abr` |
| **Breaking change** | No (new optional fields, changed picks for samples with `responseStart`) |

## Summary

This RFC proposes one download-time model for both selectors of `@svta/cml-abr`. A rung's download time is the time to first byte plus the transfer of one segment at the safe throughput. The starvation guard already tests that time against the buffer. This RFC also tests that time against the segment duration. A pick must download in less time than one segment plays. A rung that fails that test is not sustainable, and the selector picks the highest rung that passes.

The change lowers the pick when the time to first byte is a large part of the segment duration. Nothing else moves. Both selector option types gain `ignoreTimeToFirstByte`. The boolean removes the time to first byte from the pick and from the guard.

```ts
import { createThroughputSelector } from '@svta/cml-abr'

const selector = createThroughputSelector()
const ladder = [
	{ bandwidth: 1_500_000 },
	{ bandwidth: 3_000_000 },
	{ bandwidth: 6_000_000 },
	{ bandwidth: 9_000_000 },
	{ bandwidth: 12_000_000 },
]

// Four 2 second segments of 12 Mbps finished. Each waited 800 ms for its first byte and transferred at 14 Mbps.
for (let i = 0; i < 4; i++) {
	selector.sample({
		timing: { startTime: i * 2500, responseStart: i * 2500 + 800, duration: 2500, encodedBodySize: 3_000_000 },
		bandwidth: 12_000_000,
		duration: 2,
		bufferLevel: 8,
	})
}

const { index } = selector.select({ ladder, bufferLevel: 8, throughput: 14_000_000, now: 10_000, segmentDuration: 2 })
// index is 2 (6 Mbps). A 2 second segment of 9 Mbps needs 0.8 + 18 / 12.6 = 2.23 seconds, more than one segment.
// Without this RFC the pick is index 4 (12 Mbps), the highest rung at or below 0.9 * 14 Mbps.
```

## Motivation

A segment download has two parts. The player waits for the first byte, and then the body transfers. The wait depends on the round trip, the connection setup, and the server. The transfer depends on the link. The two parts are independent, and a prediction of the next download needs both.

Before [PR 588](https://github.com/streaming-video-technology-alliance/common-media-library/pull/588), the throughput estimators divided the body size by the whole duration, so the wait lowered the estimate. [Issue 587](https://github.com/streaming-video-technology-alliance/common-media-library/issues/587) measured the effect on an LG webOS 22 TV. The 112 kB segments of a live stream waited about 800 ms and measured about 1 Mbps. The 1.5 MB segments on the same connection measured 14 Mbps. The estimate stayed at 1 to 2.5 Mbps for a minute. The selector picked the 450 kbps and 730 kbps rungs. PR 588 measures a sample over its transfer and adds the time to first byte to the starvation guard.

The transfer measure leaves the pick without the wait. With 2 second segments on that TV, the pick is the highest rung at or below 0.9 times 14 Mbps. A segment of that rung waits 0.8 seconds and transfers in 1.8 seconds. The download takes 2.6 seconds for 2 seconds of media. The buffer drains, the selector drops a rung, the buffer refills, and the selector climbs again. The starvation guard prevents the stall at a low buffer and does nothing about the cycle. The [analysis](./analysis.md) has the numbers.

Other players handle the wait in three ways. video.js keeps the wait inside the throughput measure. shaka-player and dash.js 5 measure the transfer and ignore the wait. hls.js measures the transfer and adds the wait to a buffer check, as PR 588 does. dash.js 4 measured the transfer and scaled every pick by the dead-time ratio. The ratio is one minus the latency over the segment duration. The 5.0 refactor removed that scaling. This RFC takes the dash.js 4 rule and the hls.js rule and derives both from one function.

## Guide-level explanation

A player changes nothing to get the new behavior. The player already passes the timing of each download in `sample` and the segment duration in `select`. When the timing has `responseStart`, the selector tracks the time to first byte. The value is the mean of the last four finished samples. When the input has `segmentDuration`, the selector picks the highest rung whose download fits in one segment. The download time counts the safe throughput and that wait. A call without `segmentDuration` picks as today. A timing without `responseStart` adds no wait.

```ts
import { createThroughputSelector } from '@svta/cml-abr'
import { EwmaEstimator } from '@svta/cml-throughput'

const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }]
const estimator = new EwmaEstimator({ fastHalfLife: 3, slowHalfLife: 9 })
const selector = createThroughputSelector()

// The player downloads a 2 second segment of rung 2 (375,000 bytes). The first byte arrives after 600 ms, and the body transfers in 500 ms.
const timing = { startTime: 0, responseStart: 600, duration: 1100, encodedBodySize: 375_000 }
estimator.sample(timing)
selector.sample({ timing, bandwidth: ladder[2].bandwidth, duration: 2, bufferLevel: 6 })

// The estimate is 6 Mbps. The upgrade pick at 0.7 * 6 Mbps bounds rung 3: 0.6 + 6 / 4.2 = 2.03 seconds, more than one segment.
// The pick stays at rung 2. Without this RFC the upgrade pick is rung 3, the highest rung at or below 4.2 Mbps.
const { index } = selector.select({ ladder, bufferLevel: 6, throughput: estimator.getEstimate(), now: 1100, segmentDuration: 2 })
```

A player whose requests overlap turns the wait off. Such a player requests the next segment before the current download ends. The wait of one request runs during the transfer of another and delays nothing.

```ts
import { createBolaSelector } from '@svta/cml-abr'

const selector = createBolaSelector({ ignoreTimeToFirstByte: true })
```

The option also fits two other cases. The `responseStart` of the timing source does not mark the first byte of the body. The server sends the response headers before the body exists. In these cases the measured wait is not the time the download loses. The option keeps the picks of today.

## Reference-level explanation

### Model

The download time of a rung, in seconds, is:

```
downloadTime(rung) = timeToFirstByte + rung.bandwidth * segmentDuration / safeThroughput
```

`safeThroughput` is `throughput * safetyFactor` for a pick and `throughput * upgradeFactor` for an upgrade of the throughput selector. The starvation guard of the throughput selector uses `throughput * safetyFactor`, and the BOLA guard uses `throughput * starvationSafetyFactor`, both as today.

Two bounds use the download time. The sustainability bound is `downloadTime(rung) <= segmentDuration / playbackRate`, and the pick must satisfy the bound. The starvation guard is `downloadTime(rung) <= bufferLevel / playbackRate`, unchanged. A segment of media must arrive before the player plays that much media, and the buffer must outlast the download.

### The sustainable rung

One internal function finds the pick. The function takes the ladder, the safe throughput, and the playback rate. It also takes the optional segment duration and the time to first byte in seconds.

```ts
function findSustainableRung(
	ladder: readonly LadderRung[],
	safeThroughput: number,
	playbackRate: number,
	segmentDuration: number | undefined,
	timeToFirstByte: number,
): number {
	if (!isPositiveFinite(segmentDuration)) {
		return findRung(ladder, safeThroughput / playbackRate)
	}

	const budget = segmentDuration / playbackRate

	for (let i = ladder.length - 1; i >= 0; i--) {
		if (downloadTime(ladder[i], segmentDuration, safeThroughput, timeToFirstByte) <= budget) {
			return i
		}
	}

	return 0
}
```

Without a segment duration the function returns the pick of today, `findRung(ladder, safeThroughput / playbackRate)`. With a time to first byte of 0, the loop and `findRung` agree away from an exact rung boundary. Both return the highest position among equal bandwidths, and both return position 0 when no rung passes. `downloadTime` moves out of the starvation guard into its own file. The guard and the search import the same function.

### Where the selectors apply the search

| Selector | Site | Today | With this RFC |
|---|---|---|---|
| Throughput | Safety pick | `findRung(ladder, effectiveThroughput * safetyFactor)` | `findSustainableRung(ladder, throughput * safetyFactor, playbackRate, segmentDuration, timeToFirstByte)` |
| Throughput | Upgrade pick | `findRung(ladder, effectiveThroughput * upgradeFactor)` | The same call with `upgradeFactor` |
| Throughput | Starvation guard | Download time against the buffer, two passes | Unchanged |
| BOLA | Startup pick | `findRung(rungs, throughput * safetyFactor)` | `findSustainableRung(rungs, throughput * safetyFactor, 1, segmentDuration, timeToFirstByte)` |
| BOLA | Oscillation cap | `findRung(rungs, throughput * safetyFactor)` | The same call |
| BOLA | Starvation guard | Download time against the buffer, one pass | Unchanged |
| BOLA | Buffer score, placeholder, delay, stalls, aborts | | Unchanged |

The hysteresis of the throughput selector keeps its rule. Above the current rung, the selector keeps the higher of the current rung and the upgrade pick. The search is monotonic in the safe throughput, so the upgrade pick stays at or below the safety pick. The existing `upgradeFactor <= safetyFactor` validation keeps that order.

BOLA passes a playback rate of 1. The BOLA rules ignore `playbackRate`, and the BOLA guard reads the field, both as today. The README states the rule.

### The time to first byte

PR 588 defines the estimate, and this RFC does not change the estimate. The time to first byte of a finished sample is `responseStart - startTime` of its `timing`, from `getTimeToFirstByteMs` in `@svta/cml-utils`. The selector keeps the last four values and uses the mean, in seconds. A sample whose `responseStart` is missing or outside the response adds nothing. An aborted sample adds nothing. `reset` clears the values. Without values, the time to first byte is 0, and the pick is the pick of today.

### The option

`ignoreTimeToFirstByte` is an optional boolean on `ThroughputSelectorOptions` and `BolaSelectorOptions`. The default is `false`. When the option is `true`, the selector records no time to first byte. The sustainability bound then holds the pick of today, and the guard uses a time to first byte of 0. The TSDoc states the effect first and then the three reasons from the guide. The reasons are overlapping requests, a `responseStart` that is not the first byte, and early response headers.

### Edge cases

- Startup with no samples: the time to first byte is 0, and the pick is the pick of today. The first pick of an HLS session has no `segmentDuration`, because the media playlist arrives after the variant choice. That call takes the fallback.
- Time to first byte at or above `segmentDuration / playbackRate`: no rung passes, and the search returns rung 0. dash.js 4 returned quality 0 in the same case.
- Unknown throughput, `NaN`: BOLA skips the startup pick and the oscillation cap, as today. The throughput selector returns the current rung, as today.
- Throughput 0: the download time is infinite, and the pick is rung 0, as today.
- `segmentDuration` present and `bufferLevel` 0: the search picks the sustainable rung. The guard then lowers the pick to rung 0, as today.
- Ladder change in BOLA: the search runs over the distinct rungs of the rebuilt parameters, where `findRung` runs today.
- Rounding: with a time to first byte of 0 the loop compares `bandwidth * segmentDuration / safeThroughput <= segmentDuration / playbackRate`. `findRung` compares `bandwidth <= safeThroughput / playbackRate`. The two bounds are equal and round differently. A test on an exact rung boundary needs a margin of 1 bps. The BOLA tests already use that margin.

### Export surface

```ts
export type ThroughputSelectorOptions = {
	safetyFactor?: number           // @defaultValue DEFAULT_SAFETY_FACTOR
	upgradeFactor?: number          // @defaultValue DEFAULT_UPGRADE_FACTOR
	starvationTolerance?: number    // @defaultValue DEFAULT_STARVATION_TOLERANCE
	ignoreTimeToFirstByte?: boolean // new, @defaultValue false
}

export type BolaSelectorOptions = {
	safetyFactor?: number           // @defaultValue DEFAULT_SAFETY_FACTOR
	starvationSafetyFactor?: number // @defaultValue DEFAULT_STARVATION_SAFETY_FACTOR
	ignoreTimeToFirstByte?: boolean // new, @defaultValue false
}
```

Nothing else in the API report changes. `findSustainableRung`, `downloadTime`, and the time to first byte helpers stay internal. `BitrateSelectorInput`, `SegmentSample`, `ThroughputEstimator`, and `ResourceTiming` do not change.

### Differences from dash.js 4

- dash.js 4 scaled the bitrate in `getQualityForBitrate`, for every rule. This RFC bounds the pick in the two selectors, at the sites in the table above.
- dash.js 4 ignored the playback rate. The throughput selector divides the budget by `playbackRate`. BOLA passes 1.
- dash.js averages the latency of the last four requests, and so does this RFC. dash.js 4 applied the scaling only when `useDeadTimeLatency` was true. The CML option has the opposite sense and the same default behavior.
- dash.js 5 computes the average and uses the average in no rule.

### Bundle and performance impact

One loop over the ladder per pick, with no allocation. A ladder has about 5 to 10 rungs. The mean runs over four numbers. `downloadTime` is shared, so a bundle with both selectors includes the function once. The implementation PR reports the minified size.

### Testing

- Unit tests for `findSustainableRung`: the fallback equals `findRung`. A time to first byte of 0 matches `findRung` away from a boundary. A positive value lowers the rung. A value at the budget returns 0. Equal bandwidths return the highest position. The playback rate scales the budget.
- Throughput selector: the issue 587 numbers, 14 Mbps, 800 ms, and 2 second segments. The pick is at or below 7.56 Mbps, where today the bound is 12.6 Mbps. The upgrade pick uses the bound. `ignoreTimeToFirstByte` restores the pick and the guard of today. A call without `segmentDuration` is unchanged. Every existing test passes, with a 1 bps margin added only where a boundary flips.
- BOLA: the startup pick and the oscillation cap lower with the time to first byte. The buffer-based pick does not move. `ignoreTimeToFirstByte` restores today. A time to first byte at the segment duration gives rung 0 at startup.
- Simulation: the seeded playback simulation gains a time to first byte per download. The [analysis](./analysis.md) defines the scenarios and the metrics, and the implementation PR fills in the results.

### Packaging

The change joins `libs/abr` as version 0.3.0. The changelog gets a Changed entry for the picks and an Added entry for the option. The package needs the `@svta/cml-utils` release with `getTimeToFirstByteMs`, from PR 588. The exports keep `@beta`.

## Drawbacks

- The picks change for every adopter whose timing has `responseStart`. The change is downward, and the size of the change is the time to first byte over the segment duration. An adopter with 100 ms waits and 6 second segments sees a 1.7 percent lower bound, inside the safety factor. An adopter with 800 ms waits and 2 second segments sees a 40 percent lower bound.
- The model assumes one request at a time per media type. A player with overlapping requests sets `ignoreTimeToFirstByte`, and a player that forgets the option picks too low.
- The estimate is a mean of four samples. One slow response, such as an origin fetch, lowers the bound for four segments.
- The bound uses the `segmentDuration` of the call. A playlist with variable segment durations needs the duration of the next segment in each call. The input contract already asks for that duration.
- In a low-latency stream with chunked transfer, `responseStart` is not a wait and the transfer is not a link measure. Such a player sets the option or omits `segmentDuration`.
- Until then, an adopter removes the time to first byte from the guard only by omitting `responseStart`. The option is public API and waits for this RFC.

## Rationale and alternatives

- **Dead-time factor instead of a time search.** Solving the bound for the bandwidth gives `effectiveThroughput * factor * (1 - timeToFirstByte * playbackRate / segmentDuration)`, floored at 0, as a multiplier before `findRung`. The rung is the same, and the diff is smaller. The time search was chosen so that the pick and the guard call one function in code. The shared model is then visible outside this document.
- **Keep the wait inside the throughput measure.** This is the video.js model and the CML model before PR 588. The measure then depends on the size of the downloaded segment. A prediction for another rung scales the wait by the bitrate ratio. Issue 587 shows the result.
- **A time to first byte input on `BitrateSelectorInput`.** The player would estimate the wait and pass the value. CML ships no estimator for the wait, and the selector already receives the timing of every download.
- **A time to first byte estimator in `@svta/cml-throughput`.** This is the hls.js shape. `ThroughputEstimator` keeps one meaning, link throughput, and the selectors need no second estimator object. Listed under future possibilities.
- **An exponentially weighted estimate.** hls.js keeps a TTFB EWMA with the slow half-life and a default of 100 ms. The hls.js weighting gives long waits less weight. The estimate feeds a bound and a guard, where a slow sample errs toward safety. The mean of four needs no half-life and no default. dash.js uses the same mean.
- **Other names for the option.** `overlappingRequests`, `sequentialRequests`, and `prefetch` name one reason. `deadTime` names the dash.js mechanism. `ignoreTimeToFirstByte` names the effect, and the TSDoc lists the reasons, because a developer can have more than one.
- **A separate gate for the guard.** A live player could keep the bound and skip the buffer guard near the live edge. One gate, `segmentDuration`, keeps the input as it is. dash.js runs its buffer rule for live too, and the skip near the edge is an hls.js choice. The README drops the advice to omit `segmentDuration` near the live edge.

## Prior art

| Player | Throughput clock | Time to first byte in the decision |
|---|---|---|
| dash.js 5.2 | First byte to end by default. `useDeadTimeLatency: false` starts at the request. | None. The average of four latencies is logged. |
| dash.js 4 | Same | Every pick scaled by one minus latency over segment duration. Quality 0 when the latency exceeds the segment duration. Removed in [PR 4276](https://github.com/Dash-Industry-Forum/dash.js/pull/4276). |
| hls.js | `loading.first` to `loading.end`. TTFB has an EWMA with a 100 ms default. | Fetch time, bytes over bandwidth plus the TTFB estimate, must fit in the buffer plus `maxStarvationDelay`. Skipped for live. |
| shaka-player | Fetch plugin: after the headers. XHR plugin: the first progress sample starts at the request. | None. |
| video.js | Request start to now, on every progress event. | None as a term. The wait is inside the measure. |
| ExoPlayer | After the response code is read. | No latency input in the bandwidth meter. |
| CML after PR 588 | First byte to end when the sample has `responseStart`. | In both starvation guards, as the mean of the last four finished samples. |

## Unresolved questions

1. **Playback rate in BOLA.** BOLA passes 1 to the search, as its rules ignore the rate today. Should the startup pick and the oscillation cap divide the budget by `playbackRate`?
2. **Default of the option.** The default counts the time to first byte. Adopters with overlapping requests get lower picks until they set the option. Is `false` the right default?
3. **The README simulation.** The implementation replaces the numbers of the README simulation section with the runs of the analysis. Should the README keep the old runs next to the new runs?

## Future possibilities

- A time to first byte estimator in `@svta/cml-throughput`, for players that want the estimate outside a selector. A CMCD report is one use.
- A hybrid selector that runs the throughput selector at a low buffer and BOLA at a high buffer. Both children share the model.

## Revision history

- v1 (2026-10-23): initial draft.

## Final Decision

Pending community review.
