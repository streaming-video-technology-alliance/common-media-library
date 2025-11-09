export function writeInt(dataView: DataView, offset: number, size: number, value: number): void {
	const cursor = offset - dataView.byteOffset

	switch (size) {
		case 1:
			dataView.setInt8(cursor, value)
			break

		case 2:
			dataView.setInt16(cursor, value)
			break

		case 4:
			dataView.setInt32(cursor, value)
			break

		case 8:
			// Warning: JavaScript cannot handle 64-bit integers natively.
			// This will give unexpected results for integers >= 2^53
			const s1 = Math.floor(value / Math.pow(2, 32))
			const s2 = value - (s1 * Math.pow(2, 32))
			dataView.setUint32(cursor, s1)
			dataView.setUint32(cursor + 4, s2)
			break
	}
};
