import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Reads the size of the box at a position, with no move of the cursor and no allocation.
 *
 * A box header has 8 bytes, or 16 bytes when `size` is 1 and `largesize` follows (ISO/IEC 14496-12, clause 4.2).
 * A box with `size` 0 extends to `cursor.end`. The header of a `uuid` box has 16 more bytes for `usertype`.
 *
 * @param cursor - The cursor whose `end` limits the box.
 * @param at - The position of the first byte of the box.
 * @returns The size of the box. The result is 0 for a truncated box: the data ends inside the box, or the size is below the header size.
 *
 * @internal
 */
export function readIsoBoxHeader(cursor: IsoBoxReadCursor<IsoInt64>, at: number): number {
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

	return size >= header && size <= left ? size : 0
}
