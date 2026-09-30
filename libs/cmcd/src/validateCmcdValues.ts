import { SfItem } from '@svta/cml-structured-field-values'
import { CMCD_KEY_TYPE_BOOLEAN, CMCD_KEY_TYPE_INTEGER, CMCD_KEY_TYPE_NUMBER, CMCD_KEY_TYPE_NUMBER_LIST, CMCD_KEY_TYPE_STRING, CMCD_KEY_TYPE_STRING_LIST, CMCD_KEY_TYPE_TOKEN, CMCD_KEY_TYPES, CMCD_V1_KEY_TYPE_OVERRIDES } from './CMCD_KEY_TYPES.ts'
import { CMCD_CUSTOM_KEY_VALUE_MAX_LENGTH, CMCD_STRING_LENGTH_LIMITS } from './CMCD_STRING_LENGTH_LIMITS.ts'
import { CMCD_TOKEN_VALUES } from './CMCD_TOKEN_VALUES.ts'
import { CMCD_V1 } from './CMCD_V1.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdValidationIssue } from './CmcdValidationIssue.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR, CMCD_VALIDATION_SEVERITY_WARNING } from './CmcdValidationSeverity.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'
import { resolveVersion } from './resolveVersion.ts'
import { toTokenString } from './toTokenString.ts'

const HUNDRED_ROUNDING_UNITS: Record<string, string> = {
	bl: 'ms',
	dl: 'ms',
	mtp: 'kbps',
	rtp: 'kbps',
	tbl: 'ms',
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function isInteger(value: unknown): value is number {
	return Number.isInteger(value)
}

// CTA-5004 Table 1 states every rounding rule with MUST. CTA-5004-B Table 1 uses SHOULD for bl and tbl.
function validateRounding(key: string, value: number, version: number, issues: CmcdValidationIssue[], index?: number): void {
	const unit = HUNDRED_ROUNDING_UNITS[key]
	if (!unit || value % 100 === 0) {
		return
	}
	const should = key === 'tbl' || (key === 'bl' && version !== CMCD_V1)
	const target = index === undefined ? `Key "${key}"` : `Key "${key}" array element [${index}]`
	issues.push({
		key,
		message: `${target} ${should ? 'should' : 'must'} be rounded to the nearest 100 ${unit}. Received ${value}.`,
		severity: should ? CMCD_VALIDATION_SEVERITY_WARNING : CMCD_VALIDATION_SEVERITY_ERROR
	})
}

function validateListValue(key: string, value: unknown, version: number, issues: CmcdValidationIssue[]): void {
	if (!Array.isArray(value)) {
		issues.push({
			key,
			message: `Key "${key}" must be an array.`,
			severity: CMCD_VALIDATION_SEVERITY_ERROR
		})
		return
	}
	for (let i = 0; i < value.length; i++) {
		const element = value[i] instanceof SfItem ? value[i].value : value[i]
		if (!isInteger(element)) {
			issues.push({
				key,
				message: `Key "${key}" array element [${i}] must be a finite integer.`,
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}
		else {
			validateRounding(key, element, version, issues, i)
		}
	}
}

function validateStringArrayValue(key: string, value: unknown, issues: CmcdValidationIssue[]): void {
	if (!Array.isArray(value)) {
		issues.push({
			key,
			message: `Key "${key}" must be an array.`,
			severity: CMCD_VALIDATION_SEVERITY_ERROR
		})
		return
	}
	for (let i = 0; i < value.length; i++) {
		const element = value[i]
		if (element instanceof SfItem) {
			if (typeof element.value !== 'string') {
				issues.push({
					key,
					message: `Key "${key}" array element [${i}] must be a string.`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
		}
		else if (typeof element !== 'string') {
			issues.push({
				key,
				message: `Key "${key}" array element [${i}] must be a string.`,
				severity: CMCD_VALIDATION_SEVERITY_ERROR
			})
		}
	}
}

/**
 * Validates that all values in a CMCD payload conform to the expected types and constraints.
 *
 * @example
 * {@includeCode ../test/validateCmcdValues.test.ts#example}
 *
 * @param data - The CMCD payload to validate.
 * @param options - Validation options.
 * @returns The validation result.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#reserved-keys | CTA-5004-B Reserved Keys}
 *
 * @public
 */
export function validateCmcdValues(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult {
	const version = resolveVersion(data, options)
	const issues: CmcdValidationIssue[] = []

	for (const [key, value] of Object.entries(data)) {
		if (isCmcdCustomKey(key as CmcdKey)) {
			// Custom key values must be string or token, max 64 chars
			if (typeof value !== 'string') {
				issues.push({
					key,
					message: `Custom key "${key}" value must be a string or token.`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
			else if (value.length > CMCD_CUSTOM_KEY_VALUE_MAX_LENGTH) {
				issues.push({
					key,
					message: `Custom key "${key}" value exceeds maximum length of ${CMCD_CUSTOM_KEY_VALUE_MAX_LENGTH}.`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
			continue
		}

		// Version value check
		if (key === 'v') {
			if (value !== 1 && value !== 2) {
				issues.push({
					key,
					message: `Key "v" must be 1 or 2.`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR
				})
			}
			continue
		}

		// Determine expected type
		let expectedType = CMCD_KEY_TYPES[key]
		if (!expectedType) {
			continue
		}

		if (version === CMCD_V1 && key in CMCD_V1_KEY_TYPE_OVERRIDES) {
			expectedType = CMCD_V1_KEY_TYPE_OVERRIDES[key]
		}

		switch (expectedType) {
			case CMCD_KEY_TYPE_INTEGER:
				if (!isInteger(value)) {
					issues.push({
						key,
						message: `Key "${key}" must be a finite integer.`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
				else {
					validateRounding(key, value, version, issues)
				}
				break

			case CMCD_KEY_TYPE_NUMBER:
				if (!isFiniteNumber(value)) {
					issues.push({
						key,
						message: `Key "${key}" must be a finite number.`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
				break

			case CMCD_KEY_TYPE_BOOLEAN:
				if (typeof value !== 'boolean') {
					issues.push({
						key,
						message: `Key "${key}" must be a boolean.`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
				break

			case CMCD_KEY_TYPE_STRING:
				if (typeof value !== 'string') {
					issues.push({
						key,
						message: `Key "${key}" must be a string.`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
				else if (key in CMCD_STRING_LENGTH_LIMITS && value.length > CMCD_STRING_LENGTH_LIMITS[key]) {
					issues.push({
						key,
						message: `Key "${key}" exceeds maximum length of ${CMCD_STRING_LENGTH_LIMITS[key]}.`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
				break

			case CMCD_KEY_TYPE_TOKEN: {
				const validValues = CMCD_TOKEN_VALUES[key]
				const token = toTokenString(value)
				if (validValues && (token === undefined || !validValues.includes(token))) {
					issues.push({
						key,
						message: `Key "${key}" has invalid token value "${token ?? String(value)}". Expected one of: ${validValues.join(', ')}.`,
						severity: CMCD_VALIDATION_SEVERITY_ERROR
					})
				}
				break
			}

			case CMCD_KEY_TYPE_NUMBER_LIST:
				validateListValue(key, value, version, issues)
				break

			case CMCD_KEY_TYPE_STRING_LIST:
				validateStringArrayValue(key, value, issues)
				break
		}
	}

	return {
		valid: issues.every(i => i.severity !== CMCD_VALIDATION_SEVERITY_ERROR),
		issues,
	}
}
