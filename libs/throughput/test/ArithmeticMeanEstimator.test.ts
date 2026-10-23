import { ArithmeticMeanEstimator } from '@svta/cml-throughput'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('ArithmeticMeanEstimator', () => {
	it('returns NaN when there are no entries', async () => {
		const estimator = new ArithmeticMeanEstimator()

		equal(estimator.getEstimate(), NaN)
	})

	it('returns positive number when there is one entry', async () => {
		const estimator = new ArithmeticMeanEstimator()

		// 1000 bps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 1000,
		})

		equal(estimator.getEstimate(), 1000)
	})

	it('ignores a sample with a body size of 0 or less', async () => {
		const estimator = new ArithmeticMeanEstimator()

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
				375,
				`expected the estimate to ignore a body size of ${encodedBodySize}`,
			)
		}
	})

	it('ignores a sample with a duration of 0 or less', async () => {
		const estimator = new ArithmeticMeanEstimator()

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

		for (const duration of [0, -1000, NaN, Infinity]) {
			estimator.sample({ startTime: 6000, encodedBodySize: 125, duration })

			equal(
				estimator.getEstimate(),
				375,
				`expected the estimate to ignore a duration of ${duration}`,
			)
		}
	})

	it('returns positive number when there are at least 2 entries', async () => {
		const estimator = new ArithmeticMeanEstimator()

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

		equal(estimator.getEstimate(), 375)
	})
})
