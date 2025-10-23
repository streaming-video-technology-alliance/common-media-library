import { ZlemaEstimator } from '@svta/cml-throughput'
import { roundToEven } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('ZlemaEstimator', () => {
	it('returns NaN when there are no entries', async () => {
		const estimator = new ZlemaEstimator()

		equal(estimator.getEstimate(), NaN)
	})

	it('returns positive number when there is one entry', async () => {
		const estimator = new ZlemaEstimator()

		// 1000 bps
		estimator.sample({
			startTime: 0,
			encodedBodySize: 125,
			duration: 1000,
		})

		equal(estimator.getEstimate(), 1000)
	})

	it('returns positive number when there are at least 2 entries', async () => {
		const estimator = new ZlemaEstimator()

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

		const zlemaWithTwoDecimalPlaces = roundToEven(estimator.getEstimate(), 2)

		equal(zlemaWithTwoDecimalPlaces, 324.07)
	})
})
