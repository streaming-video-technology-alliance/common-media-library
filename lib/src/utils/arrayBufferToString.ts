import type { Encoding } from './Encoding.js';
import { UTF_16 } from './UTF_16.js';

/**
 * Converts an ArrayBuffer to a string.
 *
 * @param arrayBuffer - The ArrayBuffer to convert.
 * @param encoding - The encoding to use.
 * @returns The string representation of the ArrayBuffer.
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/arrayBufferToString.test.ts#example}
 */
export function arrayBufferToString(arrayBuffer: ArrayBuffer, encoding: Encoding): string {
	if (typeof TextDecoder !== 'undefined') {
		return new TextDecoder(encoding).decode(arrayBuffer);
	}

	const buffer = encoding === UTF_16 ? new Uint16Array(arrayBuffer) : new Uint8Array(arrayBuffer);

	return String.fromCharCode(...buffer);
}
