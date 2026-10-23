import { EwmaEstimator } from '@svta/cml-throughput'
import { equal, ok } from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('EwmaEstimator', () => {
	it('returns NaN when there are no entries', () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		equal(estimator.getEstimate(), NaN)
	})

	it('returns default estimate when below min total bytes', () => {
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

	it('returns the default estimate before the first sample', () => {
		const estimator = new EwmaEstimator({
			fastHalfLife: 3,
			slowHalfLife: 9,
			defaultEstimate: 1e6,
		})

		equal(estimator.getEstimate(), 1e6)
	})

	it('returns the measured rate after the first sample', () => {
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

		equal(estimator.getEstimate(), 6e6)
	})

	it('ignores a sample with a zero duration', () => {
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

	it('ignores a sample with a negative duration', () => {
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
			duration: -1000,
		})

		equal(estimator.getEstimate(), 285)
	})

	it('returns NaN when the only sample has a zero duration', () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 0,
		})

		equal(estimator.getEstimate(), NaN)
	})

	it('ignores a sample with a body size of 0 or less', () => {
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

		for (const encodedBodySize of [0, -125, NaN, Infinity]) {
			estimator.sample({ startTime: 6000, encodedBodySize, duration: 1000 })

			equal(
				estimator.getEstimate(),
				285,
				`expected the estimate to ignore a body size of ${encodedBodySize}`,
			)
		}
	})

	it('returns NaN when the only sample has a body size of 0', () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		estimator.sample({
			startTime: 0,
			encodedBodySize: 0,
			duration: 1000,
		})

		equal(estimator.getEstimate(), NaN)
	})

	it('returns positive number when there are at least 2 entries', () => {
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

describe('EwmaEstimator transfer duration', () => {
	it('measures the rate and the weight over the transfer when the sample has responseStart', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		// 112 kB that waited 800 ms for the first byte and transferred in 50 ms: 17.92 Mbps.
		estimator.sample({ startTime: 0, responseStart: 800, duration: 850, encodedBodySize: 112_000 })

		equal(estimator.getEstimate(), 17_920_000)
	})

	it('gives a sample with a long first-byte wait no more weight than its transfer', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		// A 1 s transfer at 16 Mbps, then four 50 ms transfers at 2 Mbps after 800 ms waits.
		estimator.sample({ startTime: 0, responseStart: 0, duration: 1000, encodedBodySize: 2_000_000 })
		for (let i = 1; i <= 4; i++) {
			estimator.sample({
				startTime: i * 1000,
				responseStart: i * 1000 + 800,
				duration: 850,
				encodedBodySize: 12_500,
			})
		}

		// The four short transfers weigh 0.2 s against 1 s, so the estimate stays near 16 Mbps.
		ok(
			estimator.getEstimate() > 12_000_000,
			`expected above 12 Mbps, got ${estimator.getEstimate()}`,
		)
	})

	it('ignores a sample whose transfer is shorter than minTransferMs', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5, minTransferMs: 5 })

		// 500 bps over a 2 s transfer, then a cache hit: 125 bytes in 2 ms.
		estimator.sample({ startTime: 0, encodedBodySize: 125, duration: 2000 })
		estimator.sample({ startTime: 2000, responseStart: 2000, duration: 2, encodedBodySize: 125 })

		equal(estimator.getEstimate(), 500)
	})

	it('ignores a sample whose body arrived with its first byte', async () => {
		const estimator = new EwmaEstimator({ fastHalfLife: 2, slowHalfLife: 5 })

		estimator.sample({ startTime: 0, encodedBodySize: 125, duration: 2000 })
		estimator.sample({ startTime: 2000, responseStart: 2850, duration: 850, encodedBodySize: 125 })

		equal(estimator.getEstimate(), 500)
	})
})
