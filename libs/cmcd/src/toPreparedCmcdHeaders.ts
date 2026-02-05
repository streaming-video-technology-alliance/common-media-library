import { encodeSfDict } from '@svta/cml-structured-field-values'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdHeaderField } from './CmcdHeaderField.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdHeaderValue } from './CmcdHeaderValue.ts'
import { groupCmcdHeaders } from './groupCmcdHeaders.ts'

/**
 * Encode already-prepared CMCD data to CMCD header shards.
 *
 * @param data - The prepared CMCD data to encode.
 * @param customHeaderMap - A map of CMCD header fields to custom CMCD keys.
 * @returns The CMCD header shards.
 *
 * @internal
 */
export function toPreparedCmcdHeaders(data: Cmcd, customHeaderMap?: Partial<CmcdHeaderMap>): Record<CmcdHeaderField, string> {
	const result = {} as Record<CmcdHeaderField, string>
	const shards = groupCmcdHeaders(data, customHeaderMap)

	return Object.entries(shards)
		.reduce((acc, [field, value]) => {
			const shard = encodeSfDict(value as CmcdHeaderValue, { whitespace: false })
			if (shard) {
				acc[field as CmcdHeaderField] = shard
			}
			return acc
		}, result)
}
