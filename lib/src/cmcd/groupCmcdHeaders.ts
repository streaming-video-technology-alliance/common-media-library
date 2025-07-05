import { CMCD_HEADER_MAP } from './CMCD_HEADER_MAP.js';
import type { CmcdData } from './CmcdData.js';
import { CmcdHeaderField } from './CmcdHeaderField.js';
import type { CmcdHeadersMap } from './CmcdHeadersMap.js';
import type { CmcdKey } from './CmcdKey.js';

function createHeaderMap(headerMap: Partial<CmcdHeadersMap>): Record<CmcdKey, CmcdHeaderField> {
	return Object.keys(headerMap)
		.reduce((acc, field) => {
			headerMap[field as CmcdHeaderField]?.forEach(key => acc[key] = field as CmcdHeaderField);
			return acc;
		}, {} as Record<CmcdKey, CmcdHeaderField>);
}

/**
 * Group a CMCD data object into header shards
 *
 * @param cmcd - The CMCD data object to convert.
 * @param customHeaderMap - A map of CMCD header fields to custom CMCD keys.
 *
 * @returns The CMCD header shards.
 *
 * @group CMCD
 *
 * @beta
 */
export function groupCmcdHeaders(cmcd: CmcdData, customHeaderMap?: Partial<CmcdHeadersMap>): Record<CmcdHeaderField, CmcdData> {
	const result = {} as Record<CmcdHeaderField, CmcdData>;

	if (!cmcd) {
		return result;
	}

	const keys = Object.keys(cmcd) as CmcdKey[];
	const custom = customHeaderMap ? createHeaderMap(customHeaderMap) : {} as Record<CmcdKey, CmcdHeaderField>;

	return keys.reduce((acc: Record<CmcdHeaderField, CmcdData>, key: CmcdKey) => {
		const field = CMCD_HEADER_MAP[key] || custom[key] || CmcdHeaderField.REQUEST;
		const data = acc[field] ??= {};
		(data as any)[key] = cmcd[key];
		return acc;
	}, result);
}
