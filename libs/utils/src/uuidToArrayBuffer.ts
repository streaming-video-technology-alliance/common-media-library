import { hexToArrayBuffer } from './hexToArrayBuffer.ts';

/**
 * Converts a UUID string to an ArrayBuffer.
 *
 * @param uuid - The UUID string to convert.
 * @returns The ArrayBuffer representation.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/uuidToArrayBuffer.test.ts#example}
 */
export function uuidToArrayBuffer(uuid: string): ArrayBuffer {
	const hex = uuid.replace(/-/g, '');
	return hexToArrayBuffer(hex);
}
