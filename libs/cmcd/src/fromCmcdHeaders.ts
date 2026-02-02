import type { Cmcd } from './Cmcd.ts'
import { CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS } from './CmcdHeaderField.ts'
import { decodeCmcd } from './decodeCmcd.ts'

const keys = [CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS]

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

	return keys.reduce((acc, key) => {
		const value = headers.get(key)
		return Object.assign(acc, decodeCmcd(value as string))
	}, {} as Cmcd)
}
