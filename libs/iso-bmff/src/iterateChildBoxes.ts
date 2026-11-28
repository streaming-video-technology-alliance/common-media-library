import { decodeFourCc } from './cursor/decodeFourCc.ts'
import { readIsoBoxHeader } from './cursor/readIsoBoxHeader.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Iterates over the boxes from the position of a cursor to its end, and yields a read cursor for each box.
 *
 * The function parses no content of a box. For each box, the result has the type of the box and a new cursor for that box.
 * In that cursor, `start` is the first byte of the box header, `pos` is the first byte after the header, and `end` is the first byte after the box.
 * For a `uuid` box, `pos` is the first byte of `usertype`. The cursor keeps the readers map and the options of the input.
 *
 * The function does not move the input cursor. Each cursor of the result is independent, so a move of one cursor moves no other.
 * The iteration stops before a truncated box: the data ends inside the box, or the size is below the header size.
 * The `end` of the last cursor is then the first byte of that box.
 *
 * Use the function to read some boxes of a list, to read the position of a box, or to read a box that `seekIsoBox` does not find, such as the second `traf` box of a `moof` box.
 * `readChildBoxes` reads every box of the list, and `nextIsoBox` steps over one box with no allocation.
 *
 * @param cursor - The cursor at the first byte of the first box.
 * @returns An iterator of the type and the cursor of each box.
 *
 * @example
 * {@includeCode ../test/iterateChildBoxes.test.ts#example}
 *
 * @public
 */
export function* iterateChildBoxes<V extends IsoInt64 = number, S extends boolean = boolean>(
	cursor: IsoBoxReadCursor<V, S>,
): Generator<readonly [type: IsoBoxType, cursor: IsoBoxReadCursor<V, S>], void, undefined> {
	const { view, readers, int64, spans } = cursor
	let at = cursor.pos

	for (;;) {
		const size = readIsoBoxHeader(cursor, at)

		if (!size) {
			return
		}

		const header = view.getUint32(at) === 1 ? 16 : 8
		const child = {
			view,
			start: at,
			pos: at + header,
			end: at + size,
			readers,
			int64,
			spans,
		} as IsoBoxReadCursor<V, S>

		yield [decodeFourCc(view, at + 4), child]

		at += size
	}
}
