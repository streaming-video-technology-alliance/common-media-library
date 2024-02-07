export function generateId3(
	frames: Uint8Array,
	extendedHeader: boolean = false
): Uint8Array {
	// ID3 header prefix
	const id3HeaderPrefix = stringToInts('ID3');
	// Standard header setup
	const standardHeader = new Uint8Array([
		0x03,
		0x00, // ID3 version 3.0
		extendedHeader ? 0x40 : 0x00, // Conditional flag for extended header
		0x00,
		0x00,
		0x00,
		0x00, // Placeholder for size
	]);

	// Extended header, included only if specified
	const extendedHeaderContent = extendedHeader
		? new Uint8Array([
			0x00,
			0x00,
			0x00,
			0x06, // Extended header size (excluding itself), no CRC
			0x00,
			0x00, // Extended flags
			0x00,
			0x00,
			0x00,
			0x02, // Size of padding
		])
		: new Uint8Array([]);

	// Concatenate parts to form the complete ID3 header
	const result = concat(
		id3HeaderPrefix,
		standardHeader,
		extendedHeaderContent,
		frames
	);

	// Calculate and set the ID3 size excluding the header itself
	const size = result.length - 10; // The ID3 header size (10 bytes) is not included in the size calculation
	result[6] = (size >>> 21) & 0x7f;
	result[7] = (size >>> 14) & 0x7f;
	result[8] = (size >>> 7) & 0x7f;
	result[9] = size & 0x7f;

	return result;
}

export function generateId3Frame(type: string, value: Uint8Array): Uint8Array {
	const header = new Uint8Array([
		0x00,
		0x00,
		0x00,
		0x00, // Placeholder for size
		0xe0,
		0x00, // Flags
	]);
	const typeBytes = stringToInts(type);
	const result = concat(typeBytes, header, value);

	// Calculate and set the size
	const size = result.length - 10; // Subtract the header length
	result[4] = (size >>> 21) & 0x7f;
	result[5] = (size >>> 14) & 0x7f;
	result[6] = (size >>> 7) & 0x7f;
	result[7] = size & 0x7f;

	return result;
}

export function toArrayBuffer(view: BufferSource): ArrayBuffer {
	if (view instanceof ArrayBuffer) {
		return view;
	} 
	else {
		if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) {
			// This is a TypedArray covering the whole buffer.
			return view.buffer;
		}
		// This is a 'view' on the buffer. Create a new buffer that only contains
		// the data. Note that since this isn't an ArrayBuffer, the 'new' call
		// will allocate a new buffer to hold the copy.
		return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).buffer;
	}
}

function stringToInts(str: string): Uint8Array {
	return new Uint8Array(Array.from(str).map((char) => char.charCodeAt(0)));
}

function concat(...buffers: Uint8Array[]): Uint8Array {
	const totalLength = buffers.reduce((acc, val) => acc + val.byteLength, 0);
	const result = new Uint8Array(totalLength);

	let offset = 0;
	for (const buffer of buffers) {
		result.set(buffer, offset);
		offset += buffer.byteLength;
	}

	return result;
}

