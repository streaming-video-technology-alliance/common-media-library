import type { MetaBox, MetaBoxChild } from '../boxes/MetaBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MetaBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MetaBox`
 *
 * @public
 */
export function readMeta(view: IsoBoxReadView): MetaBox {
	return {
		type: 'meta',
		...view.readFullBox(),
		boxes: view.readBoxes<MetaBoxChild>(),
	}
}
