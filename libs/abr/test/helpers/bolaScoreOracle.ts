import { MINIMUM_BUFFER, MINIMUM_BUFFER_PER_RUNG } from '../../src/BOLA_CONSTANTS.ts'

/**
 * An independent model of the BOLA score, written from the formula of the RFC.
 * It shares no formula code with `createBolaParams`, so it can check the thresholds of that function.
 * It imports the two named constants of the formula, and nothing else from the source.
 * The model works on distinct bandwidths in ascending order.
 */
type BolaScoreModel = {
	/** The score of a rung at an effective buffer. */
	score(position: number, effectiveBuffer: number): number

	/** The position of the rung with the best score. On a tie, the higher rung wins. */
	best(effectiveBuffer: number): number

	/** The effective buffer at which the score of a rung reaches zero. */
	scoreZeroLevel(position: number): number
}

const SEARCH_ITERATIONS = 80

export function createBolaScoreModel(bandwidths: readonly number[], bufferTarget: number): BolaScoreModel {
	const distinct = [...new Set(bandwidths)]
	const bufferTime = Math.max(bufferTarget, MINIMUM_BUFFER + MINIMUM_BUFFER_PER_RUNG * distinct.length)
	const utilities = distinct.map(bandwidth => Math.log(bandwidth / distinct[0]))
	const scale = (bufferTime - MINIMUM_BUFFER) / utilities[utilities.length - 1]
	const gamma = MINIMUM_BUFFER / scale

	const model: BolaScoreModel = {
		score: (position, effectiveBuffer) =>
			(scale * (utilities[position] + gamma) - effectiveBuffer) / distinct[position],

		best(effectiveBuffer) {
			let best = 0
			let bestScore = -Infinity

			for (let position = 0; position < distinct.length; position++) {
				const score = model.score(position, effectiveBuffer)

				if (score >= bestScore) {
					bestScore = score
					best = position
				}
			}

			return best
		},

		scoreZeroLevel: position => scale * (utilities[position] + gamma),
	}

	return model
}

/**
 * Finds the thresholds of a ladder by bisection of the best rung of the score model.
 * The threshold of a rung is the lowest effective buffer where that rung or a higher one scores best.
 * The first threshold is 0.
 */
export function bolaThresholds(bandwidths: readonly number[], bufferTarget: number): number[] {
	const model = createBolaScoreModel(bandwidths, bufferTarget)
	const count = new Set(bandwidths).size
	const upper = model.scoreZeroLevel(count - 1) + 1

	return Array.from({ length: count }, (_, position) => {
		if (model.best(0) >= position) {
			return 0
		}

		let low = 0
		let high = upper

		for (let i = 0; i < SEARCH_ITERATIONS; i++) {
			const middle = (low + high) / 2

			if (model.best(middle) >= position) {
				high = middle
			} else {
				low = middle
			}
		}

		return high
	})
}

/**
 * The maximum buffer of each distinct rung, which is the effective buffer at which its score reaches zero.
 */
export function bolaMaximumBuffers(bandwidths: readonly number[], bufferTarget: number): number[] {
	const model = createBolaScoreModel(bandwidths, bufferTarget)

	return Array.from({ length: new Set(bandwidths).size }, (_, position) => model.scoreZeroLevel(position))
}
