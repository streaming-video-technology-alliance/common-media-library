import type { CmcdData } from './CmcdData.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdHeaderField } from './CmcdHeaderField.js';
import { CmcdHeaderMap } from './CmcdHeaderMap.js';
import type { CmcdKey } from './CmcdKey.js';
import { encodeCmcd } from './encodeCmcd.js';

/**
 * Convert a CMCD data object to request headers
 *
 * @param cmcd - The CMCD data object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The CMCD header shards.
 *
 * @group CMCD
 *
 * @beta
 */
export function toCmcdHeaders(cmcd: CmcdData, options: CmcdEncodeOptions = {}): Record<CmcdHeaderField, string> {
	const result = {} as Record<CmcdHeaderField, string>;

	if (!cmcd) {
		return result;
	}

	const entries = Object.entries(cmcd);
	const headerMap = Object.entries(CmcdHeaderMap)
		.concat(Object.entries(options?.customHeaderMap || {}));
	const shards = entries.reduce((acc, entry) => {
		const [key, value] = entry as [CmcdKey, CmcdData[CmcdKey]];
		const field = headerMap.find(entry => entry[1].includes(key))?.[0] as CmcdHeaderField || CmcdHeaderField.REQUEST;
		acc[field] ??= {};
		acc[field][key as any] = value as any;
		return acc;
	}, {} as Record<CmcdHeaderField, CmcdData>);

	return Object.entries(shards)
		.reduce((acc, [field, value]) => {
			acc[field as CmcdHeaderField] = encodeCmcd(value, options);
			return acc;
		}, result);
}
