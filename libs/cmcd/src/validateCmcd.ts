import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { mergeValidationResults } from './mergeValidationResults.ts'
import { validateCmcdKeys } from './validateCmcdKeys.ts'
import { validateCmcdStructure } from './validateCmcdStructure.ts'
import { validateCmcdValues } from './validateCmcdValues.ts'

/**
 * Validates a CMCD payload by checking keys, values, and structure.
 *
 * {@includeCode ../test/validateCmcd.test.ts#example}
 *
 * @param data - The CMCD payload to validate.
 * @param options - Validation options.
 * @returns The validation result.
 *
 * @public
 */
export function validateCmcd(data: Record<string, unknown>, options?: CmcdValidationOptions): CmcdValidationResult {
	return mergeValidationResults(
		validateCmcdKeys(data, options),
		validateCmcdValues(data, options),
		validateCmcdStructure(data, options),
	)
}
