import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Moves the cursor past a field and returns the position of the field.
 *
 * @param cursor - The cursor to move.
 * @param size - The size of the field in bytes.
 * @returns The position of the first byte of the field.
 *
 * @throws RangeError if `size` is negative, is not an integer, or the field passes `cursor.end`. The cursor does not move.
 *
 * @internal
 */
export function take(cursor: IsoBoxReadCursor<IsoInt64>, size: number): number {
	const { pos, end } = cursor

	if (!(size >= 0 && pos + size <= end) || size % 1) {
		throw new RangeError(`Cannot read ${size} bytes at position ${pos}: the box ends at ${end}`)
	}

	cursor.pos = pos + size

	return pos
}
