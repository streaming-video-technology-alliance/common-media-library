import { decodeText, UTF_8 } from '@svta/cml-utils'

/**
 * Reads a UTF-8 string from a data view.
 *
 * @param dataView - The data view to read from.
 * @param offset - The offset to start reading from.
 * @returns The UTF-8 string.
 *
 * @internal
 */
export function readUtf8String(dataView: DataView, offset: number): string {
	const length = dataView.byteLength - (offset - dataView.byteOffset)
	return (length > 0) ? decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 }) : ''
};
