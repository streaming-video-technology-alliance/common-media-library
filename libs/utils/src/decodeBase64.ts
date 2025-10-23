/**
 * Decodes a base64 encoded string into binary data
 *
 * @param str - The base64 encoded string to decode
 * @returns The decoded binary data
 *
 *
 * @beta
 */
export function decodeBase64(str: string): Uint8Array {
	return new Uint8Array([...atob(str)].map((a) => a.charCodeAt(0)))
}
