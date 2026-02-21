import type { CmcdData } from './CmcdData.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'

/**
 * The result of validating a single CMCD payload (headers or query).
 *
 * Extends {@link CmcdValidationResult} with the decoded {@link CmcdData}.
 *
 * @public
 */
export type CmcdDataValidationResult = CmcdValidationResult & {
	/**
	 * The decoded CMCD data.
	 */
	data: CmcdData
}
