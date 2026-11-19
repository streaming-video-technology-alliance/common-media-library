import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackReferenceBox } from '../boxes/TrackReferenceBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `tref` box (`TrackReferenceBox`).
 *
 * The `writers` map does not need an entry for the `tref` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackReferenceBox` fields to write
 *
 * @public
 */
export function writeTref(cursor: IsoBoxWriteCursor, box: TrackReferenceBox): void {
	writeContainerBox(cursor, box)
}
