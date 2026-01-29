import { CMCD_HEADER_MAP } from './CMCD_HEADER_MAP.ts'
import { CmcdHeaderField } from './CmcdHeaderField.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdRequestData } from './CmcdRequestData.ts'
import type { CmcdRequestKey } from './CmcdRequestKey.ts'

function createHeaderMap(headerMap: Partial<CmcdHeaderMap>): Record<CmcdRequestKey, CmcdHeaderField> {
	return Object.keys(headerMap)
		.reduce((acc, field) => {
			headerMap[field as CmcdHeaderField]?.forEach(key => acc[key] = field as CmcdHeaderField)
			return acc
		}, {} as Record<CmcdRequestKey, CmcdHeaderField>)
}

/**
 * Group a CMCD data object into header shards
 *
 * @param cmcd - The CMCD data object to convert.
 * @param customHeaderMap - A map of CMCD header fields to custom CMCD keys.
 *
 * @returns The CMCD header shards.
 *
 * @public
 */
export function groupCmcdHeaders(cmcd: CmcdRequestData, customHeaderMap?: Partial<CmcdHeaderMap>): Record<CmcdHeaderField, CmcdRequestData> {
	const result = {} as Record<CmcdHeaderField, CmcdRequestData>

	if (!cmcd) {
		return result
	}

	const keys = Object.keys(cmcd) as CmcdRequestKey[]
	const custom: Partial<Record<CmcdRequestKey, CmcdHeaderField>> = customHeaderMap ? createHeaderMap(customHeaderMap) : {}

	return keys.reduce((acc: Record<CmcdHeaderField, CmcdRequestData>, key: CmcdRequestKey) => {
		const field = CMCD_HEADER_MAP[key] || custom[key] || CmcdHeaderField.REQUEST
		const data = acc[field] ??= {}
		data[key] = (cmcd as any)[key]
		return acc
	}, result)
}
