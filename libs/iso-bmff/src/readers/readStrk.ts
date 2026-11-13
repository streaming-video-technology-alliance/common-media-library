import type { SubTrackBox, SubTrackBoxChild } from '../boxes/SubTrackBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SubTrackBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `strk` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SubTrackBox`
 *
 * @public
 */
export function readStrk(view: IsoBoxReadView): SubTrackBox {
	return {
		type: 'strk',
		boxes: view.readBoxes<SubTrackBoxChild>(),
	}
}
