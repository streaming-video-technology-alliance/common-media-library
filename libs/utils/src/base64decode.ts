import { decodeBase64 } from './decodeBase64.ts';

/**
 * Decodes a base64 encoded string into binary data
 *
 * @param str - The base64 encoded string to decode
 * @returns The decoded binary data
 *
 *
 * @beta
 *
 * @deprecated Use {@link decodeBase64} instead.
 *
 * @see {@link decodeBase64}
 */
export const base64decode: typeof decodeBase64 = decodeBase64;
