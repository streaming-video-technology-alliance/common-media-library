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

	/**
	 * The decoded CMCD data object. Present when validation is
	 * performed by a function that decodes the input internally
	 * ({@link validateCmcd}, {@link validateCmcdHeaders},
	 * {@link validateCmcdEvent}, {@link validateCmcdRequest}).
	 *
	 * For multi-line event payloads validated by
	 * {@link validateCmcdEvent}, this is an array of decoded objects,
	 * one per event line.
	 */
	data?: Record<string, unknown> | Record<string, unknown>[]
}
