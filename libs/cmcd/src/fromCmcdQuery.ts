import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdDecodeOptions } from './CmcdDecodeOptions.ts'
import { decodeCmcd } from './decodeCmcd.ts'

/**
 * Decode CMCD data from a query string.
 *
 * @param query - The query string to decode.
 * @param options - Options for decoding.
 *
 * @returns The decoded CMCD data.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/fromCmcdQuery.test.ts#example}
 */
export function fromCmcdQuery(query: string | URLSearchParams, options: CmcdDecodeOptions & { convertToLatest: true }): Cmcd
export function fromCmcdQuery(query: string | URLSearchParams, options?: CmcdDecodeOptions): CmcdData
export function fromCmcdQuery(query: string | URLSearchParams, options?: CmcdDecodeOptions): CmcdData | Cmcd {
	if (typeof query === 'string') {
		query = new URLSearchParams(query)
	}

	const value = query.get(CMCD_PARAM)

	return decodeCmcd(value ?? '', options as CmcdDecodeOptions)
}
