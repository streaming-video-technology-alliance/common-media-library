import { decodeText } from './decodeText.js';
import { UTF_8 } from './UTF_8.js';

/**
 * Converts a UTF-8 array to a string.
 *
 * @param array - The UTF-8 array to convert
 * @param exitOnNull - Whether to exit on the first null byte
 *
 * @returns The string
 *
 * @group Utils
 *
 * @beta
 *
 * @deprecated This function is a special case of {@link decodeText} that is used by the ID3 library to decode UTF-8 encoded strings. Use {@link decodeText} instead.
 */
export function utf8ArrayToStr(
	array: Uint8Array<ArrayBuffer>,
	exitOnNull: boolean = false,
): string {
	const byteLength = exitOnNull ? array.indexOf(0) : array.length;
	const view = new DataView<ArrayBuffer>(array.buffer, array.byteOffset, byteLength);
	const result = decodeText(view, { encoding: UTF_8 });

	return exitOnNull ? result : result.replace(/\0/g, '');
}
