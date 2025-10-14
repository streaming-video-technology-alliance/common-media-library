import { CMCD_HEADER_MAP } from './CMCD_HEADER_MAP.ts';
import type { CmcdData } from './CmcdData.ts';
import { CmcdHeaderField } from './CmcdHeaderField.ts';
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts';
import type { CmcdKey } from './CmcdKey.ts';

function createHeaderMap(headerMap: Partial<CmcdHeaderMap>): Record<CmcdKey, CmcdHeaderField> {
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
 *
 * @beta
 */
export function groupCmcdHeaders(cmcd: CmcdData, customHeaderMap?: Partial<CmcdHeaderMap>): Record<CmcdHeaderField, CmcdData> {
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
