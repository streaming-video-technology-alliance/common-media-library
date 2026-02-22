import type { Cmcd } from './Cmcd.ts'
import { CMCD_HEADER_MAP } from './CMCD_HEADER_MAP.ts'
import { CmcdHeaderField } from './CmcdHeaderField.ts'
import type { CmcdHeaderKey } from './CmcdHeaderKey.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdHeaderValue } from './CmcdHeaderValue.ts'
import type { CmcdKey } from './CmcdKey.ts'

function createHeaderMap(headerMap: Partial<CmcdHeaderMap>): Record<CmcdHeaderKey, CmcdHeaderField> {
	return Object.keys(headerMap)
		.reduce((acc, field) => {
			headerMap[field as CmcdHeaderField]?.forEach(key => acc[key] = field as CmcdHeaderField)
			return acc
		}, {} as Record<CmcdKey, CmcdHeaderField>)
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
export function groupCmcdHeaders(cmcd: Cmcd, customHeaderMap?: Partial<CmcdHeaderMap>): Record<CmcdHeaderField, CmcdHeaderValue> {
	const result = {} as Record<CmcdHeaderField, CmcdHeaderValue>

	if (!cmcd) {
		return result
	}

	const keys = Object.keys(cmcd) as CmcdHeaderKey[]
	const custom: Partial<Record<CmcdHeaderKey, CmcdHeaderField>> = customHeaderMap ? createHeaderMap(customHeaderMap) : {}

	for (const key of keys) {
		const field = CMCD_HEADER_MAP[key] || custom[key] || CmcdHeaderField.REQUEST
		const data = result[field] ??= {};
		(data as Record<string, unknown>)[key] = (cmcd as Record<string, unknown>)[key]
	}

	return result
}
