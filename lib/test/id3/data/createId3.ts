import { strToCodes } from '../../utils/strToCodes.js';
import { ID3_BYTES, ID3_VERSION_BYTES } from './ID3.js';

function createId3Size(size: number) {
	// size is stored as a sequence of four 7-bit integers with the
	// high bit of each byte set to zero
	return [
		(size >>> 21) & 0x7f,
		(size >>> 14) & 0x7f,
		(size >>> 7) & 0x7f,
		size & 0x7f,
	];
}

export function createId3(type: string, data: Uint8Array): Uint8Array {
	const id3 = new Uint8Array([
		////////////
		// Header //
		////////////

		// ID3 (3 bytes)
		...ID3_BYTES,

		// Version (2 bytes) i.e 2.4.0
		...ID3_VERSION_BYTES,

		// Flags (1 byte)
		0x00,

		// Size (4 bytes)
		...createId3Size(data.byteLength + 10),

		///////////
		// Frame //
		///////////

		// Type (4 bytes)
		...strToCodes(type),

		// Size (4 bytes)
		...createId3Size(data.byteLength),

		// Flags (2 bytes)
		0x00, 0x00,

		// Payload
		...data,
	]);

	console.log('ID3_BYTES', id3);

	return id3;
}
