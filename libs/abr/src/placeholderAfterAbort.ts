// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import { MINIMUM_BUFFER } from './BOLA_CONSTANTS.ts'
import type { BolaParams } from './BolaParams.ts'

/**
 * Returns the placeholder buffer after an aborted download.
 *
 * The placeholder shrinks so that the effective buffer is at or below the threshold of the replacement rung.
 * The threshold of the lowest rung is 0, so for that replacement the limit is `MINIMUM_BUFFER`.
 * An abort of the second rung and an abort of the lowest rung then have the same limit.
 * The placeholder never grows.
 *
 * @param params - The values that BOLA derived from the ladder
 * @param replacementPosition - The position of the replacement rung in `params.rungs`
 * @param placeholder - The placeholder buffer before the abort, in seconds
 * @param bufferLevel - The real buffer level when the download aborted, in seconds. The value is 0 or more.
 * @returns The placeholder buffer after the abort, in seconds
 */
export function placeholderAfterAbort(params: BolaParams, replacementPosition: number, placeholder: number, bufferLevel: number): number {
	const limit = replacementPosition > 0 ? params.thresholds[replacementPosition] : MINIMUM_BUFFER

	return Math.min(placeholder, Math.max(0, limit - bufferLevel))
}
