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

A player can pass entries from `performance.getEntriesByName` as samples. A cross-origin entry reports an `encodedBodySize` of 0 when the response has no `Timing-Allow-Origin` header. The estimators ignore those entries. Add the header to the segment responses, or build the sample from the byte count of the loader.
