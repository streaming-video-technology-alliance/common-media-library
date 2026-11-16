import { roundToEven } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('roundToEven', () => {
	it('rounds to the nearest value', () => {
		equal(roundToEven(1.0021, 3), 1.002)
		equal(roundToEven(1.0029, 3), 1.003)
		equal(roundToEven(928.5714285714286, 2), 928.57)
	})

	it('rounds a tie to the even value', () => {
		//#region example
		equal(roundToEven(1.0025, 3), 1.002)
		equal(roundToEven(1.0035, 3), 1.004)
		//#endregion example
		equal(roundToEven(9.9995, 3), 10)
	})

	it('rounds a tie to the even value when the double is above the midpoint', () => {
		equal(roundToEven(2.0005, 3), 2)
	})

	it('rounds a tie to the even value when the double is below the midpoint', () => {
		equal(roundToEven(0.5015, 3), 0.502)
		equal(roundToEven(0.5035, 3), 0.504)
		equal(roundToEven(1.015, 2), 1.02)
	})

	it('rounds a negative tie to the even value', () => {
		equal(roundToEven(-0.5015, 3), -0.502)
		equal(roundToEven(-1.0035, 3), -1.004)
	})

	it('rounds the double above a tie up', () => {
		equal(roundToEven(0.07050000000000001, 3), 0.071)
		equal(roundToEven(0.0005000000000000001, 3), 0.001)
	})

	it('rounds the double below a tie down', () => {
		equal(roundToEven(0.10149999999999999, 3), 0.101)
	})

	it('returns a value with fewer decimal places unchanged', () => {
		equal(roundToEven(123.456, 3), 123.456)
		equal(roundToEven(5, 3), 5)
		equal(roundToEven(0, 3), 0)
	})
})
