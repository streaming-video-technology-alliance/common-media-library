import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'

/**
 * Moves the cursor past a field and returns the position of the field.
 * The function grows the buffer when the field does not fit.
 *
 * @param cursor - The cursor to move.
 * @param size - The size of the field in bytes.
 * @returns The position of the first byte of the field.
 *
 * @internal
 */
export function reserve(cursor: IsoBoxWriteCursor, size: number): number {
	const { pos, bytes } = cursor
	const needed = pos + size

	if (needed > bytes.length) {
		const grown = new Uint8Array(Math.max(bytes.length * 2, needed))

		grown.set(bytes.subarray(0, pos))
		;(cursor as { bytes: Uint8Array<ArrayBuffer> }).bytes = grown
		;(cursor as { view: DataView }).view = new DataView(grown.buffer)
	}

	cursor.pos = needed

	return pos
}
