import { CMCD_HEADER_FIELDS } from './CmcdHeaderField.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdDecodeOptions } from './CmcdDecodeOptions.ts'
import { decodeCmcd } from './decodeCmcd.ts'
import { ensureHeaders } from './ensureHeaders.ts'
import { upConvertToV2 } from './upConvertToV2.ts'

/**
 * Decode CMCD data from request headers.
 *
 * @param headers - The request headers to decode.
 * @param options - Options for decoding.
 *
 * @returns The decoded CMCD data.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/fromCmcdHeaders.test.ts#example}
 */
/** @public */
export function fromCmcdHeaders(headers: Record<string, string> | Headers, options: CmcdDecodeOptions & { convertToLatest: true }): Cmcd
/** @public */
export function fromCmcdHeaders(headers: Record<string, string> | Headers, options?: CmcdDecodeOptions): CmcdData
export function fromCmcdHeaders(headers: Record<string, string> | Headers, options?: CmcdDecodeOptions): CmcdData | Cmcd {
	const h = ensureHeaders(headers)

	const result = CMCD_HEADER_FIELDS.reduce((acc, key) => {
		const value = h.get(key)
		return Object.assign(acc, decodeCmcd(value as string))
	}, {} as CmcdData)

	if (options?.convertToLatest) {
		return upConvertToV2(result) as Cmcd
	}

	return result
}
