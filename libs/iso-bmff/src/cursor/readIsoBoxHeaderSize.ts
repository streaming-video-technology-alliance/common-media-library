import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Reads the size of the header of the box at a position, with no move of the cursor and no allocation.
 *
 * A box header has 8 bytes, or 16 bytes when `size` is 1 and `largesize` follows (ISO/IEC 14496-12, clause 4.2).
 * The header of a `uuid` box has 16 more bytes for `usertype`.
 * The first byte of the body is `at + readIsoBoxHeaderSize(cursor, at)`.
 *
 * @param cursor - The cursor whose `end` limits the data.
 * @param at - The position of the first byte of the box.
 * @returns The size of the header. The result is 0 if fewer than 8 bytes remain at `at`.
 *
 * @example
 * {@includeCode ../../test/readIsoBoxSize.test.ts#header}
 *
 * @public
 */
export function readIsoBoxHeaderSize(cursor: IsoBoxReadCursor<IsoInt64>, at: number): number {
	const { view, end } = cursor

	if (end - at < 8) {
		return 0
	}

	let header = view.getUint32(at) === 1 ? 16 : 8

	// 0x75756964 is 'uuid'
	if (view.getUint32(at + 4) === 0x75756964) {
		header += 16
	}

	return header
}
