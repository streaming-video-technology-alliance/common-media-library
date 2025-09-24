import { decodeBase64 } from './decodeBase64.js';

/**
 * Decodes a base64 encoded string into binary data
 *
 * @param str - The base64 encoded string to decode
 * @returns The decoded binary data
 *
 * @group Utils
 *
 * @beta
 *
 * @deprecated Use {@link decodeBase64} instead.
 *
 * @see {@link decodeBase64}
 */
export function base64decode(str: string): Uint8Array {
	return decodeBase64(str);
}
