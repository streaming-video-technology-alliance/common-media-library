import type { CmcdValidationSeverity } from './CmcdValidationSeverity.ts'

/**
 * Describes a single validation issue found in a CMCD payload.
 *
 * @public
 */
export type CmcdValidationIssue = {
	/**
	 * The CMCD key associated with the issue, or undefined for
	 * structural issues.
	 */
	key?: string

	/**
	 * A human-readable description of the issue.
	 */
	message: string

	/**
	 * The severity of the issue.
	 */
	severity: CmcdValidationSeverity
}
