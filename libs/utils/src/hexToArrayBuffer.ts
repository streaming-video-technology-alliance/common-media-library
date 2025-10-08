/**
 * Decodes a hexadecimal string into an ArrayBuffer.
 *
 * @param hex - The hexadecimal string to decode.
 * @returns The decoded ArrayBuffer.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/hexToArrayBuffer.test.ts#example}
 */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
	const buffer = new ArrayBuffer(hex.length / 2);
	const view = new Uint8Array(buffer);
	for (let i = 0; i < hex.length; i += 2) {
		view[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return buffer;
}
