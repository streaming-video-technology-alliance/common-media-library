import type { CmcdData } from './CmcdData.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'

/**
 * The result of validating a multi-line CMCD event payload.
 *
 * Extends {@link CmcdValidationResult} with an array of decoded
 * {@link CmcdData} objects, one per event line.
 *
 * @public
 */
export type CmcdEventsValidationResult = CmcdValidationResult & {
	/**
	 * The decoded CMCD data, one entry per event line.
	 */
	data: CmcdData[]
}
