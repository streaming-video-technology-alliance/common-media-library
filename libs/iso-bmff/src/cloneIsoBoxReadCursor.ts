import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Copies a read cursor.
 *
 * The copy has the view, the positions, the readers map, the `int64` option, and the `spans` option of the cursor.
 * The copy shares memory with the cursor and has no other link to it. A move of one cursor does not move the other.
 *
 * `readChildBoxes` and `nextIsoBox` move the cursor that they receive. To keep a position, copy the cursor first.
 *
 * @param cursor - The cursor to copy.
 * @returns A new cursor at the position of the input.
 *
 * @example
 * {@includeCode ../test/cloneIsoBoxReadCursor.test.ts#example}
 *
 * @public
 */
export function cloneIsoBoxReadCursor<V extends IsoInt64 = number, S extends boolean = boolean>(
	cursor: IsoBoxReadCursor<V, S>,
): IsoBoxReadCursor<V, S> {
	return {
		view: cursor.view,
		start: cursor.start,
		pos: cursor.pos,
		end: cursor.end,
		readers: cursor.readers,
		int64: cursor.int64,
		spans: cursor.spans,
	} as IsoBoxReadCursor<V, S>
}
