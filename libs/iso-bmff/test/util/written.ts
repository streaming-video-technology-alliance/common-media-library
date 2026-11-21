import type { IsoBoxWriteCursor } from '@svta/cml-iso-bmff'

/**
 * Returns the bytes that a write cursor holds before its position.
 *
 * @param cursor - The write cursor.
 * @returns The bytes, as numbers.
 */
export function written(cursor: IsoBoxWriteCursor): number[] {
	return Array.from(cursor.bytes.subarray(0, cursor.pos))
}
