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
const CURRENT_POSITION = 2

const PARAMS = createBolaParams(L1, BOLA_DEFAULT_BUFFER_TARGET)
const THRESHOLDS = bolaThresholds(L1_BANDWIDTHS, BOLA_DEFAULT_BUFFER_TARGET)

describe('placeholderAfterAbort', () => {
	it('caps the placeholder so that the effective buffer is at the threshold of the current rung', () => {
		closeTo(placeholderAfterAbort(PARAMS, CURRENT_POSITION, LARGE_PLACEHOLDER, BUFFER_LEVEL), THRESHOLDS[CURRENT_POSITION] - BUFFER_LEVEL, TOLERANCE)
	})

	it('uses MINIMUM_BUFFER as the limit for the lowest rung', () => {
		closeTo(placeholderAfterAbort(PARAMS, 0, LARGE_PLACEHOLDER, BUFFER_LEVEL), MINIMUM_BUFFER - BUFFER_LEVEL, TOLERANCE)
	})

	it('does not grow the placeholder', () => {
		const small = (THRESHOLDS[CURRENT_POSITION] - BUFFER_LEVEL) / 2

		equal(placeholderAfterAbort(PARAMS, CURRENT_POSITION, small, BUFFER_LEVEL), small)
	})

	it('returns 0 when the buffer is at or above the limit', () => {
		equal(placeholderAfterAbort(PARAMS, CURRENT_POSITION, LARGE_PLACEHOLDER, PARAMS.thresholds[CURRENT_POSITION]), 0)
		equal(placeholderAfterAbort(PARAMS, 0, LARGE_PLACEHOLDER, MINIMUM_BUFFER + 1), 0)
	})
})
