import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SubTrack } from '../boxes/SubTrack.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `strk` box (`SubTrack`).
 *
 * The `writers` map does not need an entry for the `strk` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `SubTrack` fields to write
 *
 * @public
 */
export function writeStrk(cursor: IsoBoxWriteCursor, box: SubTrack<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
