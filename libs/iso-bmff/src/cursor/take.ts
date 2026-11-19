import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'

/**
 * Moves the cursor past a field and returns the position of the field.
 *
 * @param cursor - The cursor to move.
 * @param size - The size of the field in bytes.
 * @returns The position of the first byte of the field.
 *
 * @throws RangeError if `size` is negative or the field passes `cursor.end`. The cursor does not move.
 *
 * @internal
 */
export function take(cursor: IsoBoxReadCursor, size: number): number {
	const { pos, end } = cursor

	if (!(size >= 0 && pos + size <= end)) {
		throw new RangeError(`Cannot read ${size} bytes at position ${pos}: the box ends at ${end}`)
	}

	cursor.pos = pos + size

	return pos
}
