import type { TrackReferenceBox } from '../boxes/TrackReferenceBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `tref` box (`TrackReferenceBox`).
 *
 * The `readers` map does not need an entry for the `tref` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackReferenceBox`
 *
 * @public
 */
export function readTref<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackReferenceBox<V> {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'tref',
		boxes: view.readBoxes(),
	}
}
