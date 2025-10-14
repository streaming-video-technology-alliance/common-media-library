import { isId3Header } from './util/isId3Header.ts'
import { readId3Size } from './util/readId3Size.ts'

/**
 * Checks if the given data contains an ID3 tag.
 *
 * @param data - The data to check
 * @param offset - The offset at which to start checking
 *
 * @returns `true` if an ID3 tag is found
 *
 *
 * @beta
 */
export function canParseId3(data: Uint8Array, offset: number): boolean {
	return (
		isId3Header(data, offset) &&
		readId3Size(data, offset + 6) + 10 <= data.length - offset
	)
}
