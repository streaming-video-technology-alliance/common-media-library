/**
 * Encodes binary data to base64
 *
 * @param binary - The binary data to encode
 * @returns The base64 encoded string
 *
 *
 * @beta
 */
export function encodeBase64(binary: Uint8Array): string {
	return btoa(String.fromCharCode(...binary))
}
