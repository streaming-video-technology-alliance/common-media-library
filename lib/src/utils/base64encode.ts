/**
 * Encodes binary data to base64
 * 
 * @param binary - The binary data to encode
 * @returns The base64 encoded string
 * 
 * @group Utils
 * 
 * @beta
 */
export function base64encode(binary: Uint8Array) {
	return btoa(String.fromCharCode(...binary));
}
