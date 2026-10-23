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
const REPLACEMENT_POSITION = 2
const LOWEST_POSITION = 0

const PARAMS = createBolaParams(L1, BOLA_DEFAULT_BUFFER_TARGET)
const THRESHOLDS = bolaThresholds(L1_BANDWIDTHS, BOLA_DEFAULT_BUFFER_TARGET)

describe('placeholderAfterAbort', () => {
	it('caps the placeholder so that the effective buffer is at the threshold of the replacement', () => {
		closeTo(
			placeholderAfterAbort(PARAMS, REPLACEMENT_POSITION, LARGE_PLACEHOLDER, BUFFER_LEVEL),
			THRESHOLDS[REPLACEMENT_POSITION] - BUFFER_LEVEL,
			TOLERANCE,
		)
	})

	it('uses MINIMUM_BUFFER as the limit when the replacement is the lowest rung', () => {
		closeTo(
			placeholderAfterAbort(PARAMS, LOWEST_POSITION, LARGE_PLACEHOLDER, BUFFER_LEVEL),
			MINIMUM_BUFFER - BUFFER_LEVEL,
			TOLERANCE,
		)
	})

	it('does not grow the placeholder', () => {
		const small = (THRESHOLDS[REPLACEMENT_POSITION] - BUFFER_LEVEL) / 2

		equal(placeholderAfterAbort(PARAMS, REPLACEMENT_POSITION, small, BUFFER_LEVEL), small)
	})

	it('returns 0 when the buffer is at or above the limit', () => {
		equal(
			placeholderAfterAbort(PARAMS, REPLACEMENT_POSITION, LARGE_PLACEHOLDER, PARAMS.thresholds[REPLACEMENT_POSITION]),
			0,
		)
		equal(placeholderAfterAbort(PARAMS, LOWEST_POSITION, LARGE_PLACEHOLDER, MINIMUM_BUFFER + 1), 0)
	})
})
