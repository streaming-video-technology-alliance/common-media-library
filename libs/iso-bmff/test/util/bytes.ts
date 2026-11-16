import { IsoBoxWriteView } from '@svta/cml-iso-bmff'

/**
 * Returns the bytes of a view.
 *
 * @param view - The view.
 * @returns The bytes. The array shares memory with the buffer of the view.
 */
export function bytes(view: ArrayBufferView): Uint8Array {
	return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}

/**
 * Returns the body bytes of a box that a function writes.
 *
 * @param write - The function that writes the body.
 * @param size - The size of the body in bytes.
 * @returns The bytes of the body.
 */
export function body(write: (writer: IsoBoxWriteView) => void, size: number): number[] {
	const writer = new IsoBoxWriteView('test', 8 + size)
	write(writer)
	return Array.from(new Uint8Array(writer.buffer).subarray(8))
}
