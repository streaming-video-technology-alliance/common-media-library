type TypedArray =
	| Int8Array
	| Uint8Array
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array
	| Uint8ClampedArray;

export function toArrayBuffer(view: ArrayBuffer | TypedArray): ArrayBuffer {
	if (view instanceof ArrayBuffer) {
		return view;
	}
	else {
		if (view.byteOffset == 0 && view.byteLength == view.buffer.byteLength) {
			// This is a TypedArray over the whole buffer.
			return view.buffer as ArrayBuffer;
		}
		// This is a 'view' on the buffer.  Create a new buffer that only contains
		// the data.  Note that since this isn't an ArrayBuffer, the 'new' call
		// will allocate a new buffer to hold the copy.
		return new Uint8Array(view).buffer;
	}
}
