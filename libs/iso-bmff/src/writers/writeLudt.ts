import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { LoudnessBox } from '../boxes/LoudnessBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `ludt` box (`LoudnessBox`).
 *
 * The `writers` map does not need an entry for the `ludt` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `LoudnessBox` fields to write
 *
 * @public
 */
export function writeLudt(cursor: IsoBoxWriteCursor, box: LoudnessBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
