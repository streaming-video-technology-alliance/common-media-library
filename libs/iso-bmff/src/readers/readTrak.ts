import type { TrackBox, TrackBoxChild } from '../boxes/TrackBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `TrackBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `trak` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TrackBox`
 *
 * @public
 */
export function readTrak(view: IsoBoxReadView): TrackBox {
	return {
		type: 'trak',
		boxes: view.readBoxes<TrackBoxChild>(),
	}
}
