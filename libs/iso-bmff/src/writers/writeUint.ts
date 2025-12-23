/**
 * Write an unsigned integer to a DataView at the specified offset.
 *
 * @param dataView - The DataView to write to
 * @param offset - The byte offset to write at
 * @param size - The size in bytes (1, 2, 3, 4, or 8)
 * @param value - The unsigned integer value to write
 *
 * @beta
 */
export function writeUint(dataView: DataView, offset: number, size: number, value: number): void {
	switch (size) {
		case 1:
			dataView.setUint8(offset, value)
			break

		case 2:
			dataView.setUint16(offset, value)
			break

		case 3:
			dataView.setUint16(offset, value >> 8)
			dataView.setUint8(offset + 2, value & 0xFF)
			break

		case 4:
			dataView.setUint32(offset, value)
			break

		case 8:
			// Warning: JavaScript cannot handle 64-bit integers natively.
			// This will give unexpected results for integers >= 2^53
			dataView.setUint32(offset, Math.floor(value / Math.pow(2, 32)))
			dataView.setUint32(offset + 4, value >>> 0)
			break
	}
}

