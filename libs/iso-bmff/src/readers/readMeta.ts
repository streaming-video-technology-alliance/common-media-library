import type { MetaBox, MetaBoxChild } from '../boxes/MetaBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `meta` box (`MetaBox`).
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MetaBox`
 *
 * @public
 */
export function readMeta<V extends IsoInt64>(view: IsoBoxReadView<V>): MetaBox<V> {
	return {
		type: 'meta',
		...view.readFullBox(),
		boxes: view.readBoxes<MetaBoxChild<V>>(),
	}
}
