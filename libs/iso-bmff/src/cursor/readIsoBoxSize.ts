import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Reads the size of the box at a position, with no move of the cursor and no allocation.
 *
 * The result is the size that the header declares, with the header (ISO/IEC 14496-12, clause 4.2).
 * A `size` of 1 reads the size from `largesize`. A `size` of 0 means that the box extends to `cursor.end`, and the result is `cursor.end - at`.
 *
 * The function does not compare the size with the remaining bytes. A result above `cursor.end - at` is a box that the data truncates.
 * To read such a box, create a cursor with an `end` at `cursor.end`, or wait for more data.
 *
 * @param cursor - The cursor whose `end` limits the data.
 * @param at - The position of the first byte of the box.
 * @returns The size of the box. The result is 0 if the data ends inside the header, or if the size is below the size of the header.
 *
 * @example
 * {@includeCode ../../test/readIsoBoxSize.test.ts#example}
 *
 * @public
 */
export function readIsoBoxSize(cursor: IsoBoxReadCursor<IsoInt64>, at: number): number {
	const { view, end } = cursor
	const left = end - at

	if (left < 8) {
		return 0
	}

	let size = view.getUint32(at)
	let header = 8

	if (size === 1) {
		if (left < 16) {
			return 0
		}

		size = view.getUint32(at + 8) * 0x100000000 + view.getUint32(at + 12)
		header = 16
	} else if (size === 0) {
		size = left
	}

	// 0x75756964 is 'uuid'
	if (view.getUint32(at + 4) === 0x75756964) {
		header += 16
	}

	return size >= header ? size : 0
}
