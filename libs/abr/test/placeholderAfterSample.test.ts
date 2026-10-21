import type { SegmentSample } from '@svta/cml-abr'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { PLACEHOLDER_DECAY } from '../src/BOLA_CONSTANTS.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from '../src/BOLA_DEFAULT_BUFFER_TARGET.ts'
import { createBolaParams } from '../src/createBolaParams.ts'
import { placeholderAfterSample } from '../src/placeholderAfterSample.ts'
import { bolaMaximumBuffers } from './helpers/bolaScoreOracle.ts'
import { closeTo } from './helpers/closeTo.ts'
import { L1, L1_BANDWIDTHS } from './helpers/ladders.ts'
import { MILLISECONDS_PER_SECOND } from './helpers/units.ts'

const SEGMENT_DURATION = 4
const REQUEST_DURATION = 400
const REQUEST_SECONDS = REQUEST_DURATION / MILLISECONDS_PER_SECOND
const TOLERANCE = 1e-9
const SMALL_PLACEHOLDER = 2
const LARGE_PLACEHOLDER = 20
const LOW_BUFFER_LEVEL = 4
const HIGH_BUFFER_LEVEL = 8

const PARAMS = createBolaParams(L1, BOLA_DEFAULT_BUFFER_TARGET)
const MAXIMUM_BUFFERS = bolaMaximumBuffers(L1_BANDWIDTHS, BOLA_DEFAULT_BUFFER_TARGET)

function sampleAt(position: number, overrides: Partial<SegmentSample> = {}): SegmentSample {
	return {
		timing: { startTime: 0, encodedBodySize: 1, duration: REQUEST_DURATION },
		bandwidth: L1_BANDWIDTHS[position],
		duration: SEGMENT_DURATION,
		bufferLevel: 0,
		...overrides,
	}
}

describe('placeholderAfterSample', () => {
	it('multiplies the placeholder by the decay', () => {
		const result = placeholderAfterSample(PARAMS, SMALL_PLACEHOLDER, sampleAt(1), LOW_BUFFER_LEVEL)

		closeTo(result, SMALL_PLACEHOLDER * PLACEHOLDER_DECAY, TOLERANCE)
		ok(result < SMALL_PLACEHOLDER)
	})

	it('keeps the effective buffer at the request start at or below the maximum buffer of the rung', () => {
		const result = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(0), HIGH_BUFFER_LEVEL)

		closeTo(result, MAXIMUM_BUFFERS[0] - (HIGH_BUFFER_LEVEL + REQUEST_SECONDS), TOLERANCE)
	})

	it('returns 0 when the buffer at the request start is above the maximum buffer', () => {
		equal(placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(0), MAXIMUM_BUFFERS[0]), 0)
	})

	it('uses the highest rung at or below the bandwidth of the sample', () => {
		const exact = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(1), HIGH_BUFFER_LEVEL)
		const between = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(1, { bandwidth: (L1_BANDWIDTHS[1] + L1_BANDWIDTHS[2]) / 2 }), HIGH_BUFFER_LEVEL)
		const below = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(0, { bandwidth: L1_BANDWIDTHS[0] / 2 }), HIGH_BUFFER_LEVEL)
		const lowest = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(0), HIGH_BUFFER_LEVEL)

		equal(between, exact)
		equal(below, lowest)
	})

	it('counts a request duration that is not finite as 0', () => {
		const unknown = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(0, { timing: { startTime: 0, encodedBodySize: 1, duration: NaN } }), HIGH_BUFFER_LEVEL)

		closeTo(unknown, MAXIMUM_BUFFERS[0] - HIGH_BUFFER_LEVEL, TOLERANCE)
	})

	it('adds the media duration of a replacement segment after the decay and the cap', () => {
		const decayed = placeholderAfterSample(PARAMS, SMALL_PLACEHOLDER, sampleAt(1, { isReplacement: true }), LOW_BUFFER_LEVEL)
		const capped = placeholderAfterSample(PARAMS, LARGE_PLACEHOLDER, sampleAt(0, { isReplacement: true }), HIGH_BUFFER_LEVEL)

		closeTo(decayed, SMALL_PLACEHOLDER * PLACEHOLDER_DECAY + SEGMENT_DURATION, TOLERANCE)
		closeTo(capped, MAXIMUM_BUFFERS[0] - (HIGH_BUFFER_LEVEL + REQUEST_SECONDS) + SEGMENT_DURATION, TOLERANCE)
	})

	it('adds nothing for a segment that is not a replacement', () => {
		const plain = placeholderAfterSample(PARAMS, SMALL_PLACEHOLDER, sampleAt(1), LOW_BUFFER_LEVEL)

		equal(placeholderAfterSample(PARAMS, SMALL_PLACEHOLDER, sampleAt(1, { isReplacement: false }), LOW_BUFFER_LEVEL), plain)
	})

	it('adds nothing for a replacement segment whose duration is not a positive finite number', () => {
		const plain = placeholderAfterSample(PARAMS, SMALL_PLACEHOLDER, sampleAt(1), LOW_BUFFER_LEVEL)

		for (const duration of [0, -SEGMENT_DURATION, NaN, Infinity]) {
			equal(placeholderAfterSample(PARAMS, SMALL_PLACEHOLDER, sampleAt(1, { isReplacement: true, duration }), LOW_BUFFER_LEVEL), plain)
		}
	})
})
