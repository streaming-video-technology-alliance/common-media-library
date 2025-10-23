# @svta/cml-throughput

Throughput estimation functionality.

## Installation

```bash
npm i @svta/cml-throughput
```

## Usage

```typescript
import { EwmaEstimator } from "@svta/cml-throughput/EwmaEstimator";

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

assert(estimator.getEstimate() === 412);
```
