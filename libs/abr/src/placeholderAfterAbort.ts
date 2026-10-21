import { MINIMUM_BUFFER } from './BOLA_CONSTANTS.ts'
import type { BolaParams } from './BolaParams.ts'

/**
 * Returns the placeholder buffer after an aborted download.
 *
 * The next lower rung is the replacement of the aborted rung.
 * The placeholder shrinks so that the effective buffer is at or below the threshold of the replacement.
 * For the second rung, the limit is 0, because the threshold of the lowest rung is 0.
 * For the lowest rung, which has no lower rung, the limit is `MINIMUM_BUFFER`. The placeholder never grows.
 *
 * @param params - The values that BOLA derived from the ladder
 * @param abortedPosition - The position of the aborted rung in `params.rungs`
 * @param placeholder - The placeholder buffer before the abort, in seconds
 * @param bufferLevel - The real buffer level when the download aborted, in seconds. The value is 0 or more.
 * @returns The placeholder buffer after the abort, in seconds
 */
export function placeholderAfterAbort(params: BolaParams, abortedPosition: number, placeholder: number, bufferLevel: number): number {
	const limit = abortedPosition > 0 ? params.thresholds[abortedPosition - 1] : MINIMUM_BUFFER

	return Math.min(placeholder, Math.max(0, limit - bufferLevel))
}
