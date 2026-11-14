import type { SubTrackBox, SubTrackBoxChild } from '../boxes/SubTrackBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
export function readStrk<V extends IsoInt64>(view: IsoBoxReadView<V>): SubTrackBox<V> {
	return {
		type: 'strk',
		boxes: view.readBoxes<SubTrackBoxChild<V>>(),
	}
}
