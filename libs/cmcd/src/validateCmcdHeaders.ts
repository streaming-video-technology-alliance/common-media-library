import { CMCD_HEADER_MAP } from './CMCD_HEADER_MAP.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdDataValidationResult } from './CmcdDataValidationResult.ts'
import { type CmcdHeaderField, CMCD_HEADER_FIELDS } from './CmcdHeaderField.ts'
import { ensureHeaders } from './ensureHeaders.ts'
import type { CmcdKey } from './CmcdKey.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { CmcdValidationOptions } from './CmcdValidationOptions.ts'
import type { CmcdValidationResult } from './CmcdValidationResult.ts'
import { CMCD_VALIDATION_SEVERITY_ERROR } from './CmcdValidationSeverity.ts'
import { decodeCmcd } from './decodeCmcd.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'
import { mergeValidationResults } from './mergeValidationResults.ts'
import { validateCmcd } from './validateCmcd.ts'

/**
 * Validates CMCD HTTP headers by checking shard placement and payload validity.
 *
 * This function accepts raw CMCD header strings, decodes each shard
 * internally, verifies that each key is placed in its correct header shard,
 * then merges all shards and runs full payload validation (keys, values, and
 * structure) on the merged data.
 *
 * {@includeCode ../test/validateCmcdHeaders.test.ts#example}
 *
 * @param headers - A `Headers` instance or a record of CMCD header fields to their raw encoded string values.
 * @param options - Validation options (excluding `reportingMode`).
 * @returns The validation result including decoded data.
 *
 * @public
 */
export function validateCmcdHeaders(headers: Record<string, string> | Headers, options?: Omit<CmcdValidationOptions, 'reportingMode'>): CmcdDataValidationResult {
	const h = ensureHeaders(headers)
	const issues: CmcdValidationResult['issues'] = []
	const decoded: Partial<Record<CmcdHeaderField, Record<string, unknown>>> = {}

	for (const headerField of CMCD_HEADER_FIELDS) {
		const raw = h.get(headerField)
		if (!raw) {
			continue
		}

		let shard: Record<string, unknown>
		try {
			shard = decodeCmcd(raw)
		} catch {
			issues.push({
				key: headerField,
				message: `Failed to decode "${headerField}" header: invalid structured field syntax.`,
				severity: CMCD_VALIDATION_SEVERITY_ERROR,
			})
			continue
		}
		decoded[headerField] = shard

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

	const shardResult: CmcdValidationResult = {
		valid: issues.length === 0,
		issues,
	}

	const merged: Record<string, unknown> = Object.assign({}, ...CMCD_HEADER_FIELDS.map(f => decoded[f]).filter(Boolean))
	const payloadResult = validateCmcd(merged, { ...options, reportingMode: CMCD_REQUEST_MODE })

	const result = mergeValidationResults(shardResult, payloadResult)
	return { ...result, data: merged as CmcdData }
}
