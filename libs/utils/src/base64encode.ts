import { encodeBase64 } from './encodeBase64.ts'

/**
 * Encodes binary data to base64
 *
 * @param binary - The binary data to encode
 * @returns The base64 encoded string
 *
 * @public
 *
 * @deprecated Use {@link encodeBase64} instead.
 *
 * @see {@link encodeBase64}
 */
export const base64encode: typeof encodeBase64 = encodeBase64
