export function toUint8(
	data: BufferSource,
	offset: number = 0,
	length: number = Infinity,
): Uint8Array<ArrayBuffer> {
	return view(data, offset, length, Uint8Array);
}

function view<T extends ArrayBufferView>(
	data: BufferSource,
	offset: number,
	length: number,
	Type: { new(buffer: ArrayBuffer, byteOffset: number, length: number): T },
): T {
	const buffer = unsafeGetArrayBuffer(data);
	let bytesPerElement: any = 1;
	if ('BYTES_PER_ELEMENT' in Type) {
		bytesPerElement = Type.BYTES_PER_ELEMENT;
	}
	// Absolute end of the |data| view within |buffer|.
	const dataOffset = isArrayBufferView(data) ? data.byteOffset : 0;
	const dataEnd = ((dataOffset) + data.byteLength) / bytesPerElement;
	// Absolute start of the result within |buffer|.
	const rawStart = ((dataOffset) + offset) / bytesPerElement;
	const start = Math.floor(Math.max(0, Math.min(rawStart, dataEnd)));
	// Absolute end of the result within |buffer|.
	const end = Math.floor(Math.min(start + Math.max(length, 0), dataEnd));
	return new Type(buffer as ArrayBuffer, start, end - start);
}

function unsafeGetArrayBuffer(view: BufferSource) {
	if (view instanceof ArrayBuffer) {
		return view;
	}
	else {
		return view.buffer;
	}
}

function isArrayBufferView(obj: any): obj is ArrayBufferView {
	return obj && obj.buffer instanceof ArrayBuffer && obj.byteLength !== undefined && obj.byteOffset !== undefined;
}
