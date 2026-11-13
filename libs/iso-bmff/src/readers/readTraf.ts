import type { TrackFragmentBox, TrackFragmentBoxChild } from '../boxes/TrackFragmentBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `TrackFragmentBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `traf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackFragmentBox`
 *
 * @public
 */
export function readTraf(view: IsoBoxReadView): TrackFragmentBox {
	return {
		type: 'traf',
		boxes: view.readBoxes<TrackFragmentBoxChild>(),
	}
}
