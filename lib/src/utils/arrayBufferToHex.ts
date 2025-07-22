/**
 * Encodes an ArrayBuffer as a hexadecimal string.
 *
 * @param buffer - The ArrayBuffer to encode.
 * @returns The hexadecimal string representation.
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/arrayBufferToHex.test.ts#example}
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
	const view = new Uint8Array(buffer);
	return view.reduce((result, byte) => result + byte.toString(16).padStart(2, '0'), '');
}
