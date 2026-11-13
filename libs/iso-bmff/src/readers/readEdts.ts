import type { EditBox, EditBoxChild } from '../boxes/EditBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `EditBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `edts` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `EditBox`
 *
 * @public
 */
export function readEdts(view: IsoBoxReadView): EditBox {
	return {
		type: 'edts',
		boxes: view.readBoxes<EditBoxChild>(),
	}
}
