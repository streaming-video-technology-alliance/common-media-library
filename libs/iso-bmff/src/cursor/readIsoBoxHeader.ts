import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readIsoBoxSize } from './readIsoBoxSize.ts'

/**
 * Reads the size of the complete box at a position, with no move of the cursor and no allocation.
 *
 * The function calls `readIsoBoxSize` and rejects a box that passes `cursor.end`.
 *
 * @param cursor - The cursor whose `end` limits the box.
 * @param at - The position of the first byte of the box.
 * @returns The size of the box. The result is 0 for a truncated box: the data ends inside the box, or the size is below the header size.
 *
 * @internal
 */
export function readIsoBoxHeader(cursor: IsoBoxReadCursor<IsoInt64>, at: number): number {
	const size = readIsoBoxSize(cursor, at)

	return size <= cursor.end - at ? size : 0
}
