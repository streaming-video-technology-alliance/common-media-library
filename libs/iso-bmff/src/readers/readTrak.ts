import type { TrackBox, TrackBoxChild } from '../boxes/TrackBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `trak` box (`TrackBox`).
 *
 * The `readers` map does not need an entry for the `trak` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackBox`
 *
 * @public
 */
export function readTrak<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackBox<V> {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'trak',
		boxes: view.readBoxes<TrackBoxChild<V>>(),
	}
}
