import { EwmaEstimator } from '@svta/cml-throughput/EwmaEstimator';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('EwmaEstimator', () => {
	it('returns NaN when there are no entries', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 });

		equal(estimator.getEstimate(), NaN);
	});

	it('returns default estimate when below min total bytes', async () => {
		const estimator = new EwmaEstimator({
			fastHalfLife: 2,
			slowHalfLife: 5,
			defaultEstimate: 1e6,
			minTotalBytes: 1000,
		});

		// 1000 bps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 1000,
		});

		equal(estimator.getEstimate(), 1e6);
	});

	it('returns positive number when there are at least 2 entries', async () => {
		//#region example
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

		equal(estimator.getEstimate(), 412);
		//#endregion example
	});
});
