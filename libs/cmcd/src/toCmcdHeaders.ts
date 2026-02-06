import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdHeaderField } from './CmcdHeaderField.ts'
import { prepareCmcdData } from './prepareCmcdData.ts'
import { toPreparedCmcdHeaders } from './toPreparedCmcdHeaders.ts'

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
	if (!cmcd) {
		return {} as Record<CmcdHeaderField, string>
	}

	return toPreparedCmcdHeaders(prepareCmcdData(cmcd, options), options?.customHeaderMap)
}
