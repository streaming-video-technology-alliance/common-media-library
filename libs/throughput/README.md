# @svta/cml-throughput

Throughput estimation functionality.

## Installation

```bash
npm i @svta/cml-throughput
```

## Usage

```typescript
import { EwmaEstimator } from "@svta/cml-throughput";

const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 });

// 500 bps
estimator.sample({
	startTime: 0,
	encodedBodySize: 125,
	duration: 2000,
});

// 250 bps
estimator.sample({
	startTime: 2000,
	encodedBodySize: 125,
	duration: 4000,
});

console.log(estimator.getEstimate());
// 285
```

## Samples

A sample needs an `encodedBodySize` above 0 and a `duration` above 0. The estimators ignore every other sample, and the estimate does not change.

A player can pass `PerformanceResourceTiming` entries as samples. For a cross-origin segment, the browser decides whether the entry has a body size:

| Browser | Body size of a cross-origin response |
| --- | --- |
| Chrome | Exposed when the response has a `Timing-Allow-Origin` header for the page origin. Chrome plans the Firefox rule for version 158. |
| Firefox 129 and later | Exposed when the request used CORS. A `no-cors` request reports 0, even with the header. |
| Safari | 0 for every cross-origin response. |

An entry with a body size of 0 is ignored, so the estimate does not change. The byte count of the loader works in every browser. Build the sample from that count when the player has it.
