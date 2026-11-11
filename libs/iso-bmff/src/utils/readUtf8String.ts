import { decodeText, UTF_8 } from '@svta/cml-utils'

/**
 * Reads a UTF-8 string from a data view.
 *
 * @param dataView - The data view to read from.
 * @param offset - The offset to start reading from.
 * @param length - The number of bytes to read. The default is every byte up to the end of the data view.
 * @returns The UTF-8 string.
 *
 * @internal
 */
export function readUtf8String(
	dataView: DataView,
	offset: number,
	length: number = dataView.byteLength - (offset - dataView.byteOffset),
): string {
	return length > 0
		? decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 })
		: ''
}
