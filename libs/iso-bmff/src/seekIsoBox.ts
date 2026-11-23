import type { IsoBoxReadCursorState } from './cursor/IsoBoxReadCursorState.ts'
import { readIsoBoxHeader } from './cursor/readIsoBoxHeader.ts'
import { createIsoBoxReadCursor } from './createIsoBoxReadCursor.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReadConfig } from './IsoBoxReadConfig.ts'
import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Finds a box by its path and returns a read cursor for that box. The function decodes no other box.
 *
 * The function treats the body of each box in the path as a list of boxes. It compares the type of each box with the path.
 * In the cursor of the result, `start` is the first byte of the box header. `pos` is the first byte after the header, and `end` is the first byte after the box.
 * For a `uuid` box, `pos` is the first byte of `usertype`.
 *
 * The function knows no box type. A box such as `meta` or `stsd` has fields before its child boxes.
 * For such a box, move `pos` past the fields, then call the function again with that cursor.
 *
 * @param data - The data, or a read cursor. The search starts at the position of a cursor, and the function does not move that cursor. The result keeps the readers map and the `int64` option of a cursor.
 * @param path - The type of each box, from the outer box to the box to find. With an empty path, the result is a cursor at the position of the input.
 * @returns A new read cursor for the first box at the path. The result is `null` for a missing box and for a truncated box.
 *
 * @throws RangeError if a type in the path does not have 4 characters. The message has the type.
 *
 * @example
 * {@includeCode ../test/seekIsoBox.test.ts#example}
 *
 * @example
 * {@includeCode ../test/seekIsoBox.test.ts#cursor}
 *
 * @public
 */
export function seekIsoBox<V extends IsoInt64 = number>(
	data: IsoBoxReadCursor<V>,
	path: readonly IsoBoxType[],
): IsoBoxReadCursor<V> | null
/**
 * Finds a box by its path and returns a read cursor for that box. The function decodes no other box.
 *
 * @param data - The data.
 * @param path - The type of each box, from the outer box to the box to find.
 * @param config - The readers map and the `int64` option of the result.
 * @returns A new read cursor for the first box at the path, or `null` for a missing box and for a truncated box.
 *
 * @public
 */
export function seekIsoBox<V extends IsoInt64 = number>(
	data: IsoBoxData,
	path: readonly IsoBoxType[],
	config?: IsoBoxReadConfig<V>,
): IsoBoxReadCursor<V> | null
export function seekIsoBox(
	data: IsoBoxData | IsoBoxReadCursor<IsoInt64>,
	path: readonly IsoBoxType[],
	config?: IsoBoxReadConfig<IsoInt64>,
): IsoBoxReadCursor<IsoInt64> | null {
	const cursor: IsoBoxReadCursorState =
		'pos' in data
			? {
					view: data.view,
					start: data.start,
					pos: data.pos,
					end: data.end,
					readers: data.readers,
					int64: data.int64,
				}
			: createIsoBoxReadCursor(data, config)
	const { view } = cursor

	for (const type of path) {
		if (type.length !== 4) {
			throw new RangeError(`A four-character code must have 4 characters, received "${type}"`)
		}
	}

	for (const type of path) {
		const code =
			((type.charCodeAt(0) << 24) |
				(type.charCodeAt(1) << 16) |
				(type.charCodeAt(2) << 8) |
				type.charCodeAt(3)) >>>
			0
		let at = cursor.pos

		for (;;) {
			const size = readIsoBoxHeader(cursor, at)

			if (!size) {
				return null
			}

			if (view.getUint32(at + 4) === code) {
				cursor.start = at
				cursor.pos = at + (view.getUint32(at) === 1 ? 16 : 8)
				cursor.end = at + size
				break
			}

			at += size
		}
	}

	return cursor
}
