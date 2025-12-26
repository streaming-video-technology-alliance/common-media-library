/**
 * Converts a string to a Uint16Array.
 *
 * @param str - The string to convert
 * @returns A Uint16Array representation of the string
 *
 * @public
 *
 * @example
 * {@includeCode ../test/stringToUint16.test.ts#example}
 */
export function stringToUint16(str: string): Uint16Array<ArrayBuffer> {
	const buffer = new ArrayBuffer(str.length * 2)
	const view = new DataView(buffer)

	for (let i = 0; i < str.length; i++) {
		view.setUint16(i * 2, str.charCodeAt(i), true) // true for little-endian
	}

	return new Uint16Array(buffer)
}
