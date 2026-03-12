import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { mergeValidationResults } from './mergeValidationResults.ts'
import { validateCmcdKeys } from './validateCmcdKeys.ts'
import { validateCmcdStructure } from './validateCmcdStructure.ts'
import { validateCmcdValues } from './validateCmcdValues.ts'

/**
 * Validates a CMCD payload by checking keys, values, and structure.
 *
 * @example
 * {@includeCode ../test/validateCmcd.test.ts#example}
 *
 * @param data - The CMCD payload to validate.
 * @param options - Validation options.
 * @returns The validation result.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-a.html#data-payload-definition-what-data-to-send | CTA-5004-A Data Payload Definition}
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
