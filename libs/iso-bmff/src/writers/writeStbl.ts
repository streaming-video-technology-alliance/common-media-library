import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SampleTableBox } from '../boxes/SampleTableBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `stbl` box (`SampleTableBox`).
 *
 * The `writers` map does not need an entry for the `stbl` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `SampleTableBox` fields to write
 *
 * @public
 */
export function writeStbl(cursor: IsoBoxWriteCursor, box: SampleTableBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
