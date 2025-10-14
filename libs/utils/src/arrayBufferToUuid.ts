import { arrayBufferToHex } from './arrayBufferToHex.ts'

/**
 * Converts an ArrayBuffer to a UUID string.
 *
 * @param buffer - The ArrayBuffer to convert.
 * @returns The UUID string representation.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/arrayBufferToUuid.test.ts#example}
 */
export function arrayBufferToUuid(buffer: ArrayBuffer): string {
	const hex = arrayBufferToHex(buffer)
	return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}
