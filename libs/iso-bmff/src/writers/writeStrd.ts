import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SubTrackDefinition } from '../boxes/SubTrackDefinition.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `strd` box (`SubTrackDefinition`).
 *
 * The `writers` map does not need an entry for the `strd` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `SubTrackDefinition` fields to write
 *
 * @public
 */
export function writeStrd(cursor: IsoBoxWriteCursor, box: SubTrackDefinition<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
