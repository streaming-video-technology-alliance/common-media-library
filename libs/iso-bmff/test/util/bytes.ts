/**
 * Returns the bytes of a view.
 *
 * @param view - The view.
 * @returns The bytes. The array shares memory with the buffer of the view.
 */
export function bytes(view: ArrayBufferView): Uint8Array {
	return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}
