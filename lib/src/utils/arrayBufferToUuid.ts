import { arrayBufferToHex } from './arrayBufferToHex.js';

/**
 * Converts an ArrayBuffer to a UUID string.
 *
 * @param buffer - The ArrayBuffer to convert.
 * @returns The UUID string representation.
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/arrayBufferToUuid.test.ts#example}
 */
export function arrayBufferToUuid(buffer: ArrayBuffer): string {
	const hex = arrayBufferToHex(buffer);
	return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}
