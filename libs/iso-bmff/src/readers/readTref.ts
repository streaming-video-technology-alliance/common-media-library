import type { TrackReferenceBox, TrackReferenceBoxChild } from '../boxes/TrackReferenceBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `TrackReferenceBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `tref` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackReferenceBox`
 *
 * @public
 */
export function readTref(view: IsoBoxReadView<IsoInt64>): TrackReferenceBox {
	return {
		type: 'tref',
		boxes: view.readBoxes<TrackReferenceBoxChild>(),
	}
}
