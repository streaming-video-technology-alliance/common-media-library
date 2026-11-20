import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackGroupBox } from '../boxes/TrackGroupBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `trgr` box (`TrackGroupBox`).
 *
 * The `writers` map does not need an entry for the `trgr` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackGroupBox` fields to write
 *
 * @public
 */
export function writeTrgr(cursor: IsoBoxWriteCursor, box: TrackGroupBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
