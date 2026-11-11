import type { MetaBox, MetaBoxChild } from '../boxes/MetaBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MetaBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MetaBox`
 *
 * @public
 */
export function readMeta(view: IsoBoxReadView<IsoInt64>): MetaBox {
	return {
		type: 'meta',
		...view.readFullBox(),
		boxes: view.readBoxes<MetaBoxChild>(),
	}
}
