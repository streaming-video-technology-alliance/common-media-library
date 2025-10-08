import { encodeBase64 } from './encodeBase64.js';

/**
 * Encodes binary data to base64
 *
 * @param binary - The binary data to encode
 * @returns The base64 encoded string
 *
 *
 * @beta
 *
 * @deprecated Use {@link encodeBase64} instead.
 *
 * @see {@link encodeBase64}
 */
export function base64encode(binary: Uint8Array): string {
	return encodeBase64(binary);
}
