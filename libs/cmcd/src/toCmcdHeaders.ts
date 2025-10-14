import { encodeSfDict } from '@svta/cml-structured-field-values';
import type { CmcdData } from './CmcdData.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import type { CmcdHeaderField } from './CmcdHeaderField.js';
import { groupCmcdHeaders } from './groupCmcdHeaders.js';
import { prepareCmcdData } from './prepareCmcdData.js';

/**
 * Convert a CMCD data object to request headers
 *
 * @param cmcd - The CMCD data object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The CMCD header shards.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/toCmcdHeaders.test.ts#example}
 */
export function toCmcdHeaders(cmcd: CmcdData, options: CmcdEncodeOptions = {}): Record<CmcdHeaderField, string> {
	const result = {} as Record<CmcdHeaderField, string>;

	if (!cmcd) {
		return result;
	}

	const data = prepareCmcdData(cmcd, options);
	const shards = groupCmcdHeaders(data, options?.customHeaderMap);

	return Object.entries(shards)
		.reduce((acc, [field, value]) => {
			const shard = encodeSfDict(value, { whitespace: false });
			if (shard) {
				acc[field as CmcdHeaderField] = shard;
			}
			return acc;
		}, result);
}
