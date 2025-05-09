export function readUint(dataView: DataView, offset: number, size: number): number {
	const cursor = offset - dataView.byteOffset;

	let value: number = NaN;
	let s1: number;
	let s2: number;

	switch (size) {
		case 1:
			value = dataView.getUint8(cursor);
			break;

		case 2:
			value = dataView.getUint16(cursor);
			break;

		case 3:
			s1 = dataView.getUint16(cursor);
			s2 = dataView.getUint8(cursor + 2);
			value = (s1 << 8) + s2;
			break;

		case 4:
			value = dataView.getUint32(cursor);
			break;

		case 8:
			// Warning: JavaScript cannot handle 64-bit integers natively.
			// This will give unexpected results for integers >= 2^53
			s1 = dataView.getUint32(cursor);
			s2 = dataView.getUint32(cursor + 4);
			value = (s1 * Math.pow(2, 32)) + s2;
			break;
	}

	return value;
};
