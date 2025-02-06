/**
 * Decodes a base64 encoded string into binary data
 *
 * @param str - The base64 encoded string to decode
 * @returns The decoded binary data
 *
 * @group Utils
 *
 * @example
 * ```ts
 * import { base64decode } from '@svta/common-media-library/utils/base64decode.js';
 *
 * const data = base64decode('SGVsbG8gV29ybGQ=');
 * console.log(data); // Uint8Array(11) [ 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100 ]
 * ```
 *
 * @beta
 */
export function base64decode(str: string): Uint8Array {
	return new Uint8Array([...atob(str)].map((a) => a.charCodeAt(0)));
}
