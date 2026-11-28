import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackFragmentBox } from '../boxes/TrackFragmentBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `traf` box (`TrackFragmentBox`).
 *
 * The `writers` map does not need an entry for the `traf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackFragmentBox` fields to write
 *
 * @public
 */
export function writeTraf(cursor: IsoBoxWriteCursor, box: TrackFragmentBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
