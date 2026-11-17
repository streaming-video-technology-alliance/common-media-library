import { decodeText, UTF_8 } from '@svta/cml-utils'

/**
 * Reads a UTF-8 string from a data view.
 *
 * With `TextDecoder`, the result has no leading byte order mark.
 * Without `TextDecoder`, the result keeps a leading byte order mark as U+FEFF.
 *
 * @param dataView - The data view to read from.
 * @param offset - The offset to start reading from.
 * @param length - The number of bytes to read.
 * @returns The UTF-8 string.
 *
 * @internal
 */
export function readUtf8String(dataView: DataView, offset: number, length: number): string {
	return length > 0
		? decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 })
		: ''
}
