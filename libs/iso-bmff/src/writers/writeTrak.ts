import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackBox } from '../boxes/TrackBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `trak` box (`TrackBox`).
 *
 * The `writers` map does not need an entry for the `trak` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackBox` fields to write
 *
 * @public
 */
export function writeTrak(cursor: IsoBoxWriteCursor, box: TrackBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
