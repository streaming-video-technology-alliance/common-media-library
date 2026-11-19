import type { EditBox, EditBoxChild } from '../boxes/EditBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `edts` box (`EditBox`).
 *
 * The `readers` map does not need an entry for the `edts` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `EditBox`
 *
 * @public
 */
export function readEdts<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditBox<V> {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'edts',
		boxes: view.readBoxes<EditBoxChild<V>>(),
	}
}
