import { encodeSfDict } from '@svta/cml-structured-field-values'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdHeaderField } from './CmcdHeaderField.ts'
import { groupCmcdHeaders } from './groupCmcdHeaders.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'

/**
 * Convert a CMCD data object to request headers
 *
 * @param cmcd - The CMCD data object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The CMCD header shards.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/toCmcdHeaders.test.ts#example}
 */
export function toCmcdHeaders(cmcd: Cmcd, options: CmcdEncodeOptions = {}): Record<CmcdHeaderField, string> {
	const result = {} as Record<CmcdHeaderField, string>

	if (!cmcd) {
		return result
	}

	const data = prepareCmcdData(cmcd, options)
	const shards = groupCmcdHeaders(data, options?.customHeaderMap)

	return Object.entries(shards)
		.reduce((acc, [field, value]) => {
			const shard = encodeSfDict(value, { whitespace: false })
			if (shard) {
				acc[field as CmcdHeaderField] = shard
			}
			return acc
		}, result)
}
