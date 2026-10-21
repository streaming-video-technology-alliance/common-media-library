// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import type { BolaParams } from './BolaParams.ts'

/**
 * Returns the position of the highest distinct rung with a threshold at or below `effectiveBuffer`.
 * That rung has the best BOLA score. On a tie, the higher rung wins.
 *
 * @param params - The values that BOLA derived from the ladder
 * @param effectiveBuffer - The real buffer plus the placeholder buffer, in seconds
 * @returns The position in `params.rungs`
 */
export function selectRungByBuffer(params: BolaParams, effectiveBuffer: number): number {
	let position = params.thresholds.length - 1

	while (position > 0 && params.thresholds[position] > effectiveBuffer) {
		position--
	}

	return position
}
