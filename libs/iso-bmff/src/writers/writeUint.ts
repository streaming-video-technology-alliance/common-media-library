export function writeUint(dataView: DataView, offset: number, size: number, value: number): void {
	const cursor = offset - dataView.byteOffset

	switch (size) {
		case 1:
			dataView.setUint8(cursor, value)
			break

		case 2:
			dataView.setUint16(cursor, value)
			break

		case 3: {
			const s1 = (value & 0xFFFF00) >> 8
			const s2 = (value & 0x0000FF)
			dataView.setUint16(cursor, s1)
			dataView.setUint8(cursor + 2, s2)
			break
		}

		case 4:
			dataView.setUint32(cursor, value)
			break

		case 8: {
			// Warning: JavaScript cannot handle 64-bit integers natively.
			// This will give unexpected results for integers >= 2^53
			const s1 = Math.floor(value / Math.pow(2, 32))
			const s2 = value - (s1 * Math.pow(2, 32))
			dataView.setUint32(cursor, s1)
			dataView.setUint32(cursor + 4, s2)
			break
		}
	}
}
