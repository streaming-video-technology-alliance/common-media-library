import { equal } from 'node:assert'
import { describe, it } from 'vitest'
import { NEGLIGIBLE_DELAY } from '../src/BOLA_CONSTANTS.ts'
import { computeDelay } from '../src/computeDelay.ts'
import { closeTo } from './helpers/closeTo.ts'

const TOLERANCE = 1e-9
// The size of the error that the placeholder arithmetic leaves behind.
const ROUNDING_ERROR = 1e-15
const LARGE_EXCESS = 10

describe('computeDelay', () => {
	it('returns no delay when there is no excess', () => {
		equal(computeDelay(0, 0), 0)
		equal(computeDelay(0, 3), 0)
	})

	it('returns no delay when the placeholder absorbs the whole excess', () => {
		equal(computeDelay(2, 5), 0)
		equal(computeDelay(5, 5), 0)
	})

	it('returns the part of the excess that the placeholder does not absorb', () => {
		closeTo(computeDelay(3, 1), 2, TOLERANCE)
		closeTo(computeDelay(3, 0), 3, TOLERANCE)
	})

	it('returns no delay for a remainder that is not above the negligible delay', () => {
		equal(computeDelay(NEGLIGIBLE_DELAY, 0), 0)
		equal(computeDelay(NEGLIGIBLE_DELAY / 2, 0), 0)
		equal(computeDelay(ROUNDING_ERROR, 0), 0)
	})

	it('returns the delay for a remainder above the negligible delay', () => {
		const remainder = 2 * NEGLIGIBLE_DELAY

		closeTo(computeDelay(remainder, 0), remainder, TOLERANCE)
		closeTo(computeDelay(LARGE_EXCESS + remainder, LARGE_EXCESS), remainder, TOLERANCE)
	})
})
