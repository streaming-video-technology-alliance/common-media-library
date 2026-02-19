import type { CmcdValidationIssue } from './CmcdValidationIssue.ts'

/**
 * The result of validating a CMCD payload.
 *
 * @public
 */
export type CmcdValidationResult = {
	/** Whether the payload is valid. True if there are zero errors
	 * (warnings are acceptable).
	 */
	valid: boolean

	/**
	 * The list of validation issues found.
	 */
	issues: CmcdValidationIssue[]
}
