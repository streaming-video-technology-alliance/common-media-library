import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { MINIMUM_BUFFER } from '../src/BOLA_CONSTANTS.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from '../src/BOLA_DEFAULT_BUFFER_TARGET.ts'
import { createBolaParams } from '../src/createBolaParams.ts'
import { placeholderAfterAbort } from '../src/placeholderAfterAbort.ts'
import { bolaThresholds } from './helpers/bolaScoreOracle.ts'
import { closeTo } from './helpers/closeTo.ts'
import { L1, L1_BANDWIDTHS } from './helpers/ladders.ts'

const TOLERANCE = 1e-9
const LARGE_PLACEHOLDER = 50
const BUFFER_LEVEL = 5
const ABORTED_POSITION = 3

const PARAMS = createBolaParams(L1, BOLA_DEFAULT_BUFFER_TARGET)
const THRESHOLDS = bolaThresholds(L1_BANDWIDTHS, BOLA_DEFAULT_BUFFER_TARGET)

describe('placeholderAfterAbort', () => {
	it('caps the placeholder so that the effective buffer is at the threshold of the next lower rung', () => {
		closeTo(placeholderAfterAbort(PARAMS, ABORTED_POSITION, LARGE_PLACEHOLDER, BUFFER_LEVEL), THRESHOLDS[ABORTED_POSITION - 1] - BUFFER_LEVEL, TOLERANCE)
	})

	it('uses the threshold of the lowest rung, which is 0, as the limit for the second rung', () => {
		equal(placeholderAfterAbort(PARAMS, 1, LARGE_PLACEHOLDER, 0), 0)
		equal(placeholderAfterAbort(PARAMS, 1, LARGE_PLACEHOLDER, BUFFER_LEVEL), 0)
	})

	it('uses MINIMUM_BUFFER as the limit for the lowest rung', () => {
		closeTo(placeholderAfterAbort(PARAMS, 0, LARGE_PLACEHOLDER, BUFFER_LEVEL), MINIMUM_BUFFER - BUFFER_LEVEL, TOLERANCE)
	})

	it('does not grow the placeholder', () => {
		const small = (THRESHOLDS[ABORTED_POSITION - 1] - BUFFER_LEVEL) / 2

		equal(placeholderAfterAbort(PARAMS, ABORTED_POSITION, small, BUFFER_LEVEL), small)
	})

	it('returns 0 when the buffer is at or above the limit', () => {
		equal(placeholderAfterAbort(PARAMS, ABORTED_POSITION, LARGE_PLACEHOLDER, PARAMS.thresholds[ABORTED_POSITION - 1]), 0)
		equal(placeholderAfterAbort(PARAMS, 0, LARGE_PLACEHOLDER, MINIMUM_BUFFER + 1), 0)
	})
})
