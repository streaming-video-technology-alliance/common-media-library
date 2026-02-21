import { CMCD_KEYS } from './CMCD_KEYS.ts'
import { CMCD_V1 } from './CMCD_V1.ts'
import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'
import { resolveVersion } from './resolveVersion.ts'

/**
 * Validates that all keys in a CMCD payload are recognized spec keys or valid custom keys.
 *
 * {@includeCode ../test/validateCmcdKeys.test.ts#example}
 *
 * @param data - The CMCD payload to validate.
 * @param options - Validation options.
 * @returns The validation result.
 *
 * @public
 */
export function validateCmcdKeys(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult {
	const version = resolveVersion(data, options)
	const validKeys = version === CMCD_V1 ? CMCD_V1_KEYS as readonly string[] : CMCD_KEYS as readonly string[]
	const issues: CmcdValidationResult['issues'] = []

	for (const key of Object.keys(data)) {
		if (isCmcdCustomKey(key as CmcdKey)) {
			continue
		}

		if (!validKeys.includes(key)) {
			issues.push({
				key,
				message: `Unknown CMCD key "${key}" for version ${version}.`,
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			})
		}
	}

	return {
		valid: issues.length === 0,
		issues,
	}
}
