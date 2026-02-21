import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'

/**
 * Merges multiple validation results into a single result.
 *
 * @internal
 */
export function mergeValidationResults(...results: CmcdValidationResult[]): CmcdValidationResult {
	const issues = results.flatMap(r => r.issues)
	return {
		valid: issues.every(i => i.severity !== CMCD_VALIDATION_SEVERITY_ERROR),
		issues,
	}
}
