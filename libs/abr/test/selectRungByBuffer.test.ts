import { equal, ok } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { THRESHOLD_TOLERANCE } from '../src/BOLA_CONSTANTS.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from '../src/BOLA_DEFAULT_BUFFER_TARGET.ts'
import { createBolaParams } from '../src/createBolaParams.ts'
import { selectRungByBuffer } from '../src/selectRungByBuffer.ts'
import { createBolaScoreModel } from './helpers/bolaScoreOracle.ts'
import { L1, L1_BANDWIDTHS, L2, L2_BANDWIDTHS, rungs } from './helpers/ladders.ts'
import { L1_GOLDEN, L2_GOLDEN } from './helpers/goldenRungs.ts'
import { createSeededRandom } from './helpers/seededRandom.ts'

const BUFFER_TARGET = BOLA_DEFAULT_BUFFER_TARGET
const EDGE = 1e-6
const GRID_STEP = 0.05
const GRID_END = 60
const RANDOM_LADDER_COUNT = 300
const LEVELS_PER_LADDER = 40

function randomLadder(random: () => number): number[] {
	const count = 2 + Math.floor(random() * 11)
	const bandwidths = new Set<number>()

	while (bandwidths.size < count) {
		bandwidths.add(Math.round(100_000 * Math.pow(100, random())))
	}

	return [...bandwidths].sort((a, b) => a - b)
}

describe('selectRungByBuffer', () => {
	it('picks the rungs of the design record', () => {
		for (const [ladder, bandwidths, golden] of [
			[L1, L1_BANDWIDTHS, L1_GOLDEN],
			[L2, L2_BANDWIDTHS, L2_GOLDEN],
		] as const) {
			const params = createBolaParams(ladder, BUFFER_TARGET)
			const model = createBolaScoreModel(bandwidths, BUFFER_TARGET)

			for (const [effectiveBuffer, expected] of golden) {
				equal(selectRungByBuffer(params, effectiveBuffer), expected, `buffer ${effectiveBuffer}`)
				equal(model.best(effectiveBuffer), expected, `oracle at buffer ${effectiveBuffer}`)
			}
		}
	})

	it('picks the rung with the best score for random ladders', () => {
		const random = createSeededRandom(42)

		for (let n = 0; n < RANDOM_LADDER_COUNT; n++) {
			const bandwidths = randomLadder(random)
			const bufferTarget = 10 + random() * 40
			const params = createBolaParams(rungs(...bandwidths), bufferTarget)
			const model = createBolaScoreModel(bandwidths, bufferTarget)

			for (let i = 0; i < LEVELS_PER_LADDER; i++) {
				const effectiveBuffer = random() * (params.maximumBuffers[bandwidths.length - 1] + 5)

				equal(
					selectRungByBuffer(params, effectiveBuffer),
					model.best(effectiveBuffer),
					`ladder ${bandwidths} target ${bufferTarget} buffer ${effectiveBuffer}`,
				)
			}
		}
	})

	it('never picks a lower rung when the buffer grows', () => {
		for (const ladder of [L1, L2]) {
			const params = createBolaParams(ladder, BUFFER_TARGET)
			let previous = 0

			for (let effectiveBuffer = 0; effectiveBuffer <= GRID_END; effectiveBuffer += GRID_STEP) {
				const position = selectRungByBuffer(params, effectiveBuffer)

				ok(position >= previous, `buffer ${effectiveBuffer} picked ${position} after ${previous}`)
				ok(position < params.rungs.length)

				previous = position
			}
		}
	})

	it('moves up exactly at each threshold, and a tie goes to the higher rung', () => {
		const params = createBolaParams(L2, BUFFER_TARGET)

		for (let i = 1; i < params.thresholds.length; i++) {
			equal(selectRungByBuffer(params, params.thresholds[i] - EDGE), i - 1)
			equal(selectRungByBuffer(params, params.thresholds[i]), i)
			equal(selectRungByBuffer(params, params.thresholds[i] + EDGE), i)
		}
	})

	it('counts a buffer within the tolerance below a threshold as at the threshold', () => {
		const params = createBolaParams(L2, BUFFER_TARGET)

		for (let i = 1; i < params.thresholds.length; i++) {
			equal(selectRungByBuffer(params, params.thresholds[i] - THRESHOLD_TOLERANCE / 2), i)
			equal(selectRungByBuffer(params, params.thresholds[i] - THRESHOLD_TOLERANCE * 2), i - 1)
		}
	})

	it('never picks the lowest rung when a large target clamps the second threshold to 0', () => {
		const target = 60
		const params = createBolaParams(L1, target)
		const model = createBolaScoreModel(L1_BANDWIDTHS, target)

		equal(params.thresholds[1], 0)
		equal(selectRungByBuffer(params, 0), 1)
		equal(model.best(0), 1)
	})

	it('returns the lowest rung for an empty buffer and for one distinct bandwidth', () => {
		equal(selectRungByBuffer(createBolaParams(L1, BUFFER_TARGET), 0), 0)
		equal(selectRungByBuffer(createBolaParams(L1, BUFFER_TARGET), -5), 0)
		equal(selectRungByBuffer(createBolaParams(rungs(L1_BANDWIDTHS[0]), BUFFER_TARGET), 100), 0)
	})
})
