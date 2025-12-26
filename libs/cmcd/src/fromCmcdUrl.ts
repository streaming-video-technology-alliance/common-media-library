import type { Cmcd } from './Cmcd.ts'
import { decodeCmcd } from './decodeCmcd.ts'

/**
 * Decode CMCD data from a url encoded string.
 *
 * @param url - The url encoded string to decode.
 *
 * @returns The decoded CMCD data.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/fromCmcdUrl.test.ts#example}
 */
export function fromCmcdUrl(url: string): Cmcd {
	return decodeCmcd(decodeURIComponent(url.replace(/^CMCD=/, '')))
}
