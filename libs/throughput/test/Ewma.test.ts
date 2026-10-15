import { Ewma } from '@svta/cml-throughput'
import { roundToEven } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('Ewma', () => {
	it('returns 0 before the first sample', async () => {
		const ewma = new Ewma(0.5)

		equal(ewma.getEstimate(), 0)
		equal(ewma.getTotalDuration(), 0)
	})

	it('returns the value after one sample', async () => {
		const ewma = new Ewma(0.5)

		ewma.sample(2, 100)

		equal(ewma.getEstimate(), 100)
	})

	it('weights the new value by 1 - alpha ^ weight', async () => {
		const ewma = new Ewma(0.5)

		ewma.sample(2, 100)
		ewma.sample(2, 300)

		// (300 * 0.75 + 0.25 * 75) / (1 - 0.5 ^ 4)
		equal(ewma.getEstimate(), 260)
	})

	it('returns the last value when alpha is 0', async () => {
		const ewma = new Ewma(0)

		ewma.sample(2, 100)
		ewma.sample(3, 50)

		equal(ewma.getEstimate(), 50)
	})

	it('ignores a sample whose estimate is NaN', async () => {
		const ewma = new Ewma(0.5)

		ewma.sample(2, 100)
		ewma.sample(0, Infinity)
		ewma.sample(1, NaN)

		equal(ewma.getEstimate(), 100)
		equal(ewma.getTotalDuration(), 2)
	})

	it('derives alpha from a half-life', async () => {
		//#region example
		// A half-life of 2 seconds
		const ewma = new Ewma(Math.exp(Math.log(0.5) / 2))

		// 500 bps over 2 seconds
		ewma.sample(2, 500)

		// 1000 bps over 4 seconds
		ewma.sample(4, 1000)

		equal(roundToEven(ewma.getEstimate(), 2), 928.57)
		equal(ewma.getTotalDuration(), 6)
		//#endregion example
	})
})
