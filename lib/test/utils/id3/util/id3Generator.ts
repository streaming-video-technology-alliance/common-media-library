import { toUint8 } from '../../../../src/id3/util/utf8.js';

export function generateId3(
	frames: Uint8Array,
	extendedHeader: boolean = false
) {
	let result = concat(
		stringToInts('ID3'),
		new Uint8Array([
			0x03,
			0x00, // version 3.0 of ID3v2 (aka ID3v.2.3.0)
			0x40, // flags. include an extended header
			0x00,
			0x00,
			0x00,
			0x00, // size. set later
			// extended header
			0x00,
			0x00,
			0x00,
			0x06, // extended header size. no CRC
			0x00,
			0x00, // extended flags
			0x00,
			0x00,
			0x00,
			0x02, // size of padding
		]),
		frames
	);
	if (!extendedHeader) {
		result = concat(
			stringToInts('ID3'),
			new Uint8Array([
				0x03,
				0x00, // version 3.0 of ID3v2 (aka ID3v.2.3.0)
				0x00, // flags
				0x00,
				0x00,
				0x00,
				0x00, // size. set later
			]),
			frames
		);
	}

	// size is stored as a sequence of four 7-bit integers with the
	// high bit of each byte set to zero
	const size = result.length - 10;

	result[6] = (size >>> 21) & 0x7f;
	result[7] = (size >>> 14) & 0x7f;
	result[8] = (size >>> 7) & 0x7f;
	result[9] = size & 0x7f;

	return result;
}

export function generateId3Frame(type: string, value: Uint8Array) {
	const result = concat(
		stringToInts(type),
		new Uint8Array([
			0x00,
			0x00,
			0x00,
			0x00, // size
			0xe0,
			0x00, // flags
		]),
		value
	);

	// set the size
	const size = result.length - 10;

	result[4] = (size >>> 21) & 0x7f;
	result[5] = (size >>> 14) & 0x7f;
	result[6] = (size >>> 7) & 0x7f;
	result[7] = size & 0x7f;

	return result;
}

function concat(...varArgs: BufferSource[]) {
	let totalLength = 0;
	for (let i = 0; i < varArgs.length; ++i) {
		const value = varArgs[i];
		totalLength += value.byteLength;
	}

	const result = new Uint8Array(totalLength);
	let offset = 0;

	for (let i = 0; i < varArgs.length; ++i) {
		const value = varArgs[i];
		if (value instanceof Uint8Array) {
			result.set(value, offset);
		} 
		else {
			result.set(toUint8(value), offset);
		}
		offset += value.byteLength;
	}

	return result;
}

function stringToInts(string: string) {
	const result: number[] = [];
	for (let i = 0; i < string.length; i++) {
		result[i] = string.charCodeAt(i);
	}
	return new Uint8Array(result);
}
