/**
 * Write a string to a DataView at the specified offset.
 *
 * @param dataView - The DataView to write to
 * @param offset - The byte offset to write at
 * @param value - The string value to write
 *
 * @beta
 */
export function writeString(dataView: DataView, offset: number, value: string): void {
	for (let i = 0; i < value.length; i++) {
		dataView.setUint8(offset + i, value.charCodeAt(i))
	}
}

