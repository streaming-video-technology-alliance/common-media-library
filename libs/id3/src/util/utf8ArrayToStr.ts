import { decodeText, UTF_8 } from '@svta/cml-utils'

/**
 * Converts a UTF-8 array to a string.
 *
 * @param array - The UTF-8 array to convert
 * @param exitOnNull - Whether to exit on the first null byte
 *
 * @returns The string
 *
 * @internal
 */
export function utf8ArrayToStr(
	array: Uint8Array,
	exitOnNull: boolean = false,
): string {
	const byteLength = exitOnNull ? array.indexOf(0) : array.length
	const view = new DataView(array.buffer, array.byteOffset, byteLength)
	const result = decodeText(view, { encoding: UTF_8 })

	return exitOnNull ? result : result.replace(/\0/g, '')
}
