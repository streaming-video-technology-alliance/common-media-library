// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import type { BolaParams } from './BolaParams.ts'
import type { LadderRung } from './LadderRung.ts'
import { MINIMUM_BUFFER, MINIMUM_BUFFER_PER_RUNG } from './BOLA_CONSTANTS.ts'

/**
 * Derives the BOLA thresholds from a validated ladder and a buffer target.
 *
 * The buffer time is the larger of `bufferTarget` and `MINIMUM_BUFFER + MINIMUM_BUFFER_PER_RUNG * count`,
 * where `count` is the number of distinct bandwidths.
 * The score of rung `i` at the effective buffer `Q` is `(V * (v_i + gamma) - Q) / bandwidth_i`.
 * Rung `i` has the best score from its threshold on. At that value of `Q`, its score first beats the score of rung `i - 1`.
 *
 * @param ladder - The rungs in ascending order of bandwidth, already validated
 * @param bufferTarget - The buffer level in seconds that the player aims for
 * @returns The distinct rungs, their positions, their thresholds, and the values that the conversion of the effective buffer needs
 */
export function createBolaParams(ladder: readonly LadderRung[], bufferTarget: number): BolaParams {
	const rungs: LadderRung[] = []
	const positions: number[] = []

	for (let position = 0; position < ladder.length; position++) {
		const rung = ladder[position]
		const last = rungs.length - 1

		if (last >= 0 && rungs[last].bandwidth === rung.bandwidth) {
			positions[last] = position
		} else {
			// Copy the rung, so that a change that the caller makes in place does not reach the stored values.
			rungs.push({ bandwidth: rung.bandwidth })
			positions.push(position)
		}
	}

	const lowestBandwidthLog = Math.log(rungs[0].bandwidth)

	if (rungs.length === 1) {
		return {
			rungs,
			positions,
			thresholds: [0],
			maximumBuffers: [0],
			utilityScale: 0,
			lowestBandwidthLog,
		}
	}

	const bufferTime = Math.max(bufferTarget, MINIMUM_BUFFER + MINIMUM_BUFFER_PER_RUNG * rungs.length)
	const utilities = rungs.map(rung => Math.log(rung.bandwidth) - lowestBandwidthLog)
	const utilityScale = (bufferTime - MINIMUM_BUFFER) / utilities[utilities.length - 1]
	const gamma = MINIMUM_BUFFER / utilityScale

	const thresholds = rungs.map((rung, i) => {
		if (i === 0) {
			return 0
		}

		const lower = rungs[i - 1].bandwidth
		const crossing =
			(rung.bandwidth * utilities[i - 1] - lower * utilities[i]) / (rung.bandwidth - lower)

		return Math.max(0, utilityScale * (gamma + crossing))
	})

	const maximumBuffers = utilities.map(utility => utilityScale * (utility + gamma))

	return { rungs, positions, thresholds, maximumBuffers, utilityScale, lowestBandwidthLog }
}
