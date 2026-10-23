import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'vitest'
import { MINIMUM_BUFFER, MINIMUM_BUFFER_PER_RUNG } from '../src/BOLA_CONSTANTS.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from '../src/BOLA_DEFAULT_BUFFER_TARGET.ts'
import { createBolaParams } from '../src/createBolaParams.ts'
import { bolaThresholds, createBolaScoreModel } from './helpers/bolaScoreOracle.ts'
import { closeTo } from './helpers/closeTo.ts'
import { bandwidthsOf, L1, L1_BANDWIDTHS, L2, rungs } from './helpers/ladders.ts'

const BUFFER_TARGET = BOLA_DEFAULT_BUFFER_TARGET
const ONE_BANDWIDTH = 500_000
const MATCH_TOLERANCE = 1e-9
// The reference values of the design record have three decimals.
const REFERENCE_TOLERANCE = 0.0006

describe('createBolaParams', () => {
	it('matches the reference values of the design record', () => {
		const l1 = createBolaParams(L1, BUFFER_TARGET)
		const l2 = createBolaParams(L2, BUFFER_TARGET)
		const l1Thresholds = [7.961, 10.745, 13.059, 15.372]
		const l2Thresholds = [5.106, 7.845, 10.046, 11.992, 14.558, 17.161, 18.857, 20.705, 22.782]

		closeTo(l1.utilityScale, 3.3381, REFERENCE_TOLERANCE)
		closeTo(l2.utilityScale, 6.2382, REFERENCE_TOLERANCE)

		l1Thresholds.forEach((expected, i) =>
			closeTo(l1.thresholds[i + 1], expected, REFERENCE_TOLERANCE),
		)
		l2Thresholds.forEach((expected, i) =>
			closeTo(l2.thresholds[i + 1], expected, REFERENCE_TOLERANCE),
		)
	})

	it('places each threshold where the score model switches to that rung', () => {
		for (const ladder of [L1, L2]) {
			const params = createBolaParams(ladder, BUFFER_TARGET)
			const expected = bolaThresholds(bandwidthsOf(ladder), BUFFER_TARGET)

			params.thresholds.forEach((threshold, i) => closeTo(threshold, expected[i], MATCH_TOLERANCE))
		}
	})

	it('sets each maximum buffer where the score of the rung is zero', () => {
		for (const ladder of [L1, L2]) {
			const params = createBolaParams(ladder, BUFFER_TARGET)
			const model = createBolaScoreModel(bandwidthsOf(ladder), BUFFER_TARGET)

			params.maximumBuffers.forEach((maximumBuffer, i) =>
				closeTo(model.score(i, maximumBuffer), 0, MATCH_TOLERANCE),
			)
		}
	})

	it('gives the lowest rung a maximum buffer of MINIMUM_BUFFER', () => {
		closeTo(createBolaParams(L1, BUFFER_TARGET).maximumBuffers[0], MINIMUM_BUFFER, MATCH_TOLERANCE)
	})

	it('keeps the thresholds in increasing order', () => {
		for (const ladder of [L1, L2]) {
			const { thresholds } = createBolaParams(ladder, BUFFER_TARGET)

			for (let i = 1; i < thresholds.length; i++) {
				ok(thresholds[i] > thresholds[i - 1], `threshold ${i} must be above threshold ${i - 1}`)
			}
		}
	})

	it('raises a buffer target below the smallest buffer time', () => {
		const smallest = MINIMUM_BUFFER + MINIMUM_BUFFER_PER_RUNG * L1.length

		deepEqual(createBolaParams(L1, 1), createBolaParams(L1, smallest))
		ok(
			createBolaParams(L1, smallest + 5).thresholds[1] !==
				createBolaParams(L1, smallest).thresholds[1],
		)
	})

	it('does not depend on the scale of the bandwidths', () => {
		const scale = 7.3
		const scaled = createBolaParams(
			rungs(...bandwidthsOf(L2).map(bandwidth => bandwidth * scale)),
			BUFFER_TARGET,
		)
		const original = createBolaParams(L2, BUFFER_TARGET)

		original.thresholds.forEach((threshold, i) =>
			closeTo(scaled.thresholds[i], threshold, MATCH_TOLERANCE),
		)
	})

	it('merges equal neighbouring bandwidths and keeps the highest position', () => {
		const params = createBolaParams(
			rungs(300_000, 300_000, 750_000, 750_000, 750_000, 1_500_000),
			BUFFER_TARGET,
		)

		deepEqual(bandwidthsOf(params.rungs), [300_000, 750_000, 1_500_000])
		deepEqual(params.positions, [1, 4, 5])
	})

	it('counts only the distinct bandwidths in the smallest buffer time', () => {
		const duplicated = createBolaParams(rungs(L1_BANDWIDTHS[0], ...L1_BANDWIDTHS), BUFFER_TARGET)
		const distinct = createBolaParams(L1, BUFFER_TARGET)

		deepEqual(duplicated.thresholds, distinct.thresholds)
		deepEqual(duplicated.maximumBuffers, distinct.maximumBuffers)
	})

	it('keeps its own copy of the rungs', () => {
		const ladder = rungs(...L1_BANDWIDTHS)
		const params = createBolaParams(ladder, BUFFER_TARGET)

		ladder[1].bandwidth = L1_BANDWIDTHS[0]

		deepEqual(bandwidthsOf(params.rungs), L1_BANDWIDTHS)
	})

	it('derives no thresholds for one distinct bandwidth', () => {
		for (const ladder of [rungs(ONE_BANDWIDTH), rungs(ONE_BANDWIDTH, ONE_BANDWIDTH)]) {
			const params = createBolaParams(ladder, BUFFER_TARGET)

			equal(params.rungs.length, 1)
			deepEqual(params.thresholds, [0])
			deepEqual(params.maximumBuffers, [0])
			equal(params.utilityScale, 0)
		}

		deepEqual(createBolaParams(rungs(ONE_BANDWIDTH, ONE_BANDWIDTH), BUFFER_TARGET).positions, [1])
	})
})
