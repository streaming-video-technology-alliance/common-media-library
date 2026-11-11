/**
 * Counts the bytes of a null-terminated string in a data view. The count
 * excludes the null byte. A string with no null byte ends at the end of
 * the data view.
 *
 * @param dataView - The data view to read from.
 * @param offset - The offset of the first byte of the string.
 * @returns The number of bytes before the null byte.
 *
 * @internal
 */
export function getTerminatedStringLength(dataView: DataView, offset: number): number {
	const { byteLength } = dataView
	const start = offset - dataView.byteOffset

	let end = start

	while (end < byteLength && dataView.getUint8(end) !== 0) {
		end++
	}

	return end - start
}
