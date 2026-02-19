import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.ts'
import { CMCD_V1 } from './CMCD_V1.ts'
import { CMCD_EVENT_CUSTOM_EVENT, CMCD_EVENT_ERROR, CMCD_EVENT_PLAY_STATE, CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationIssue } from './CmcdValidationIssue.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR, CMCD_VALIDATION_SEVERITY_WARNING } from './CmcdValidationSeverity.ts'
import { resolveVersion } from './resolveVersion.ts'

/**
 * Validates the structural rules of a CMCD payload.
 *
 * {@includeCode ../test/validateCmcdStructure.test.ts#example}
 *
 * @param data - The CMCD payload to validate.
 * @param options - Validation options.
 * @returns The validation result.
 *
 * @public
 */
export function validateCmcdStructure(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult {
	const version = resolveVersion(data, options)
	const issues: CmcdValidationIssue[] = []

	// Event mode checks
	if (options?.reportingMode === CMCD_EVENT_MODE) {
		if (!('e' in data)) {
			issues.push({
				key: 'e',
				message: 'Event mode requires the "e" key to be present.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}
		if (!('ts' in data)) {
			issues.push({
				key: 'ts',
				message: 'Event mode requires the "ts" key to be present.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}
	}

	// Custom event checks
	if ('e' in data) {
		if (data['e'] === CMCD_EVENT_CUSTOM_EVENT) {
			if (!('cen' in data)) {
				issues.push({
					key: 'cen',
					message: 'Custom event (e="ce") requires the "cen" key to be present.',
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
		}
		else {
			if ('cen' in data) {
				issues.push({
					key: 'cen',
					message: 'The "cen" key must only be present when e="ce".',
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
		}

		// Response-received key restriction and required url
		if (data['e'] === CMCD_EVENT_RESPONSE_RECEIVED) {
			if (!('url' in data)) {
				issues.push({
					key: 'url',
					message: 'Response received event (e="rr") requires the "url" key to be present.',
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
		}
		else {
			for (const key of CMCD_RESPONSE_KEYS) {
				if (key in data) {
					issues.push({
						key,
						message: `Response key "${key}" must only be present when e="rr".`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
			}
		}

		// Play state change requires sta
		if (data['e'] === CMCD_EVENT_PLAY_STATE && !('sta' in data)) {
			issues.push({
				key: 'sta',
				message: 'Play state event (e="ps") requires the "sta" key to be present.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}

		// Error event requires ec
		if (data['e'] === CMCD_EVENT_ERROR && !('ec' in data)) {
			issues.push({
				key: 'ec',
				message: 'Error event (e="e") requires the "ec" key to be present.',
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}
	}

	// Version key checks
	if (version > 1 && !('v' in data)) {
		issues.push({
			key: 'v',
			message: 'Version 2 payloads require the "v" key to be present.',
			severity: CMCD_VALIDATION_SEVERITY_ERROR
		})
	}
	else if (version === CMCD_V1 && 'v' in data) {
		issues.push({
			key: 'v',
			message: 'Version 1 payloads should omit the "v" key (v1 is the default).',
			severity: CMCD_VALIDATION_SEVERITY_WARNING
		})
	}

	return {
		valid: issues.every(i => i.severity !== CMCD_VALIDATION_SEVERITY_ERROR),
		issues,
	}
}
