import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'
import { decodeCmcd } from './decodeCmcd.ts'
import { mergeValidationResults } from './mergeValidationResults.ts'
import { validateCmcd } from './validateCmcd.ts'

/**
 * Validates a raw CMCD string as an event-mode payload.
 *
 * This function decodes the string internally and validates it with
 * `reportingMode` set to `'event'`. The input may contain multiple
 * newline-separated events (e.g. a `text/cmcd` POST body), in which
 * case each line is validated independently and the results are merged.
 *
 * {@includeCode ../test/validateCmcdEvent.test.ts#example}
 *
 * @param cmcd - The raw CMCD-encoded string to validate. May contain
 *   multiple newline-separated event lines.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result.
 *
 * @public
 */
export function validateCmcdEvent(cmcd: string, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdValidationResult {
	const opts = { ...options, reportingMode: CMCD_EVENT_MODE } as const
	const lines = cmcd.split('\n').filter(line => line.length > 0)

	if (lines.length === 0) {
		return {
			valid: false,
			issues: [{
				message: 'Empty event mode payload. At least one event line is required.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			}],
		}
	}

	return mergeValidationResults(...lines.map(line => validateCmcd(decodeCmcd(line), opts)))
}
