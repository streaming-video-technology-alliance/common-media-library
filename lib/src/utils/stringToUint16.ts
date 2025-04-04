/**
 * Converts a string to a Uint16Array.
 *
 * @param str - The string to convert
 * @returns A Uint16Array representation of the string
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/stringToUint16.test.ts#example}
 */
export function stringToUint16(str: string): Uint16Array {
	return new Uint16Array([...str].map(char => char.charCodeAt(0)));
}
