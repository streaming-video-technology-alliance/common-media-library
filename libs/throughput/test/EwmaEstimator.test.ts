import { EwmaEstimator } from '@svta/cml-throughput'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('EwmaEstimator', () => {
	it('returns NaN when there are no entries', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		equal(estimator.getEstimate(), NaN)
	})

	it('returns default estimate when below min total bytes', async () => {
		const estimator = new EwmaEstimator({
			fastHalfLife: 2,
			slowHalfLife: 5,
			defaultEstimate: 1e6,
			minTotalBytes: 1000,
		})

		// 1000 bps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 1000,
		})

		equal(estimator.getEstimate(), 1e6)
	})

	it('returns the default estimate before the first sample', async () => {
		const estimator = new EwmaEstimator({
			fastHalfLife: 3,
			slowHalfLife: 9,
			defaultEstimate: 1e6,
		})

		equal(estimator.getEstimate(), 1e6)
	})

	it('returns a positive estimate after one sample', async () => {
		const estimator = new EwmaEstimator({
			fastHalfLife: 3,
			slowHalfLife: 9,
			defaultEstimate: 1e6,
		})

		// 6 Mbps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 750_000,
			duration: 1000,
		})

		const estimate = estimator.getEstimate()

		ok(estimate > 1e6, `expected an estimate above the default, received ${estimate}`)
		ok(estimate < 6e6, `expected an estimate below the sample, received ${estimate}`)
	})

	it('ignores a sample with a zero duration', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		// 500 bps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 2000,
		})

		// 250 bps
		estimator.sample({
			startTime: 2000,
			encodedBodySize: 125,
			duration: 4000,
		})

		estimator.sample({
			startTime: 6000,
			encodedBodySize: 125,
			duration: 0,
		})

		equal(estimator.getEstimate(), 285)
	})

	it('returns NaN when the only sample has a zero duration', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 0,
		})

		equal(estimator.getEstimate(), NaN)
	})

	it('returns positive number when there are at least 2 entries', async () => {
		//#region example
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		// 500 bps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 2000,
		})

		// 250 bps
		estimator.sample({
			startTime: 2000,
			encodedBodySize: 125,
			duration: 4000,
		})

		equal(estimator.getEstimate(), 285)
		//#endregion example
	})
})
