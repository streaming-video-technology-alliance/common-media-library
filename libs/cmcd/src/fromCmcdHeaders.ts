import type { Cmcd } from './Cmcd.ts'
import { CMCD_HEADER_FIELDS } from './CmcdHeaderField.ts'
import { decodeCmcd } from './decodeCmcd.ts'


/**
 * Decode CMCD data from request headers.
 *
 * @param headers - The request headers to decode.
 *
 * @returns The decoded CMCD data.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/fromCmcdHeaders.test.ts#example}
 */
export function fromCmcdHeaders(headers: Record<string, string> | Headers): Cmcd {
	if (!(headers instanceof Headers)) {
		headers = new Headers(headers)
	}

	return CMCD_HEADER_FIELDS.reduce((acc, key) => {
		const value = headers.get(key)
		return Object.assign(acc, decodeCmcd(value as string))
	}, {} as Cmcd)
}
