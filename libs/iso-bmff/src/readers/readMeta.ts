import type { MetaBox, MetaBoxChild } from '../boxes/MetaBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `meta` box (`MetaBox`).
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MetaBox`
 *
 * @public
 */
export function readMeta<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MetaBox<V> {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'meta',
		...view.readFullBox(),
		boxes: view.readBoxes<MetaBoxChild<V>>(),
	}
}
