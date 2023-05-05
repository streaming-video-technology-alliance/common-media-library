import { isId3Header } from './isId3Header.js';
import { readId3Size } from './readId3Size.js';

/**
 * Checks if the given data contains an ID3 tag.
 * 
 * @param data - The data to check
 * @param offset - The offset at which to start checking
 * 
 * @returns True if an ID3 tag is found
 */
export function canParseId3(data: Uint8Array, offset: number): boolean {
	return (
		isId3Header(data, offset) &&
		readId3Size(data, offset + 6) + 10 <= data.length - offset
	);
}
