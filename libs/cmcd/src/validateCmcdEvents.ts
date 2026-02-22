import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdEventsValidationResult } from './CmcdEventsValidationResult.ts'
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
 * @example
 * {@includeCode ../test/validateCmcdEvents.test.ts#example}
 *
 * @param cmcd - The raw CMCD-encoded string to validate. May contain
 *   multiple newline-separated event lines.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result including decoded data per event line.
 *
 * @public
 */
export function validateCmcdEvents(cmcd: string, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdEventsValidationResult {
	const opts = { ...options, reportingMode: CMCD_EVENT_MODE } as const
	const lines = cmcd.split(/\r?\n/).filter(line => line.length > 0)

	if (lines.length === 0) {
		return {
			valid: false,
			issues: [{
				message: 'Empty event mode payload. At least one event line is required.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			}],
			data: [],
		}
	}

	const decodedLines: CmcdData[] = []
	const lineResults: CmcdValidationResult[] = []

	for (let i = 0; i < lines.length; i++) {
		try {
			const data = decodeCmcd(lines[i])
			decodedLines.push(data)
			lineResults.push(validateCmcd(data, opts))
		} catch {
			decodedLines.push({} as CmcdData)
			lineResults.push({
				valid: false,
				issues: [{
					message: `Failed to decode event line ${i + 1}: invalid structured field syntax.`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR,
				}],
			})
		}
	}

	const result = mergeValidationResults(...lineResults)
	return { ...result, data: decodedLines }
}
