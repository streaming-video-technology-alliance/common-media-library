import { MINIMUM_BUFFER } from './BOLA_CONSTANTS.ts'
import type { BolaParams } from './BolaParams.ts'

/**
 * Returns the placeholder buffer after an aborted download.
 *
 * The placeholder shrinks so that the effective buffer is at or below the threshold of the current rung.
 * For the lowest rung, the limit is `MINIMUM_BUFFER`. The placeholder never grows.
 *
 * @param params - The values that BOLA derived from the ladder
 * @param position - The position of the current rung in `params.rungs`
 * @param placeholder - The placeholder buffer before the abort, in seconds
 * @param bufferLevel - The real buffer level when the download aborted, in seconds. The value is 0 or more.
 * @returns The placeholder buffer after the abort, in seconds
 */
export function placeholderAfterAbort(params: BolaParams, position: number, placeholder: number, bufferLevel: number): number {
	const limit = position > 0 ? params.thresholds[position] : MINIMUM_BUFFER

	return Math.min(placeholder, Math.max(0, limit - bufferLevel))
}
