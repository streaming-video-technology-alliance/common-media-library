/**
 * Encodes a string to a Uint8Array.
 *
 * @param text - The text to encode.
 * @returns A Uint8Array representation of the text.
 *
 * @beta
 */
export function encodeText(text: string): Uint8Array {
	return new TextEncoder().encode(text)
}
