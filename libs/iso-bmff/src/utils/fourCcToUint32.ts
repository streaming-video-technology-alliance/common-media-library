/**
 * Converts a 4-character string (e.g., FourCC code) to a Uint32 number.
 * Each character's code point is treated as a byte in big-endian order.
 *
 * @param str - A 4-character FourCC string
 * @returns The uint32 representation of the FourCC code
 *
 * @public
 *
 * @example
 * {@includeCode ../../test/fourCcToUint32.test.ts#example}
 */
export function fourCcToUint32(str: string): number {
	return (
		(str.charCodeAt(0) << 24) |
		(str.charCodeAt(1) << 16) |
		(str.charCodeAt(2) << 8) |
		str.charCodeAt(3)
	) >>> 0
}
