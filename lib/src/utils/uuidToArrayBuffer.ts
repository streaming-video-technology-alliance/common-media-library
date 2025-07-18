import { decodeHex } from './decodeHex.js';

/**
 * Converts a UUID string to an ArrayBuffer.
 *
 * @param uuid - The UUID string to convert.
 * @returns The ArrayBuffer representation.
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/uuidToArrayBuffer.test.ts#example}
 */
export function uuidToArrayBuffer(uuid: string): ArrayBuffer {
	const hex = uuid.replace(/-/g, '');
	return decodeHex(hex);
}
