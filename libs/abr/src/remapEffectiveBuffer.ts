// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import type { BolaParams } from './BolaParams.ts'
import { MINIMUM_BUFFER } from './BOLA_CONSTANTS.ts'

/**
 * Converts an effective buffer from one set of BOLA values to another, so that both pick the same bitrate.
 *
 * The switch point between two neighbouring rungs depends only on their bandwidths.
 * In `theta = (Q - MINIMUM_BUFFER) / V + ln(lowest bandwidth)`, that point has the same value in both sets.
 * The conversion keeps `theta` and solves for the new `Q`.
 * It needs two distinct bandwidths in both sets.
 *
 * @param previous - The values before the change of the ladder or the buffer target
 * @param next - The values after the change
 * @param effectiveBuffer - The effective buffer in seconds under `previous`
 * @returns The effective buffer in seconds under `next`
 */
export function remapEffectiveBuffer(previous: BolaParams, next: BolaParams, effectiveBuffer: number): number {
	const theta = (effectiveBuffer - MINIMUM_BUFFER) / previous.utilityScale + previous.lowestBandwidthLog

	return MINIMUM_BUFFER + next.utilityScale * (theta - next.lowestBandwidthLog)
}
