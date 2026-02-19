import { CMCD_HEADER_MAP } from './CMCD_HEADER_MAP.ts'
import { type CmcdHeaderField, CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS } from './CmcdHeaderField.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

const HEADER_FIELDS: CmcdHeaderField[] = [CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS]

/**
 * Validates that CMCD keys are placed in the correct header shards.
 *
 * {@includeCode ../test/validateCmcdHeaders.test.ts#example}
 *
 * @param headers - A record of CMCD header fields to their decoded key-value maps.
 * @returns The validation result.
 *
 * @public
 */
export function validateCmcdHeaders(headers: Partial<Record<CmcdHeaderField, Record<string, unknown>>>): CmcdValidationResult {
	const issues: CmcdValidationResult['issues'] = []

	for (const headerField of HEADER_FIELDS) {
		const shard = headers[headerField]
		if (!shard) {
			continue
		}

		for (const key of Object.keys(shard)) {
			if (isCmcdCustomKey(key as CmcdKey)) {
				continue
			}

			const expectedHeader = CMCD_HEADER_MAP[key as keyof typeof CMCD_HEADER_MAP]
			if (expectedHeader && expectedHeader !== headerField) {
				issues.push({
					key,
					message: `Key "${key}" is in "${headerField}" but should be in "${expectedHeader}".`,
					severity: CMCD_VALIDATION_SEVERITY_ERROR,
				})
			}
		}
	}

	return {
		valid: issues.length === 0,
		issues,
	}
}
