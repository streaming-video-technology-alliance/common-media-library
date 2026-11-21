import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { DataInformationBox } from '../boxes/DataInformationBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `dinf` box (`DataInformationBox`).
 *
 * The `writers` map does not need an entry for the `dinf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `DataInformationBox` fields to write
 *
 * @public
 */
export function writeDinf(cursor: IsoBoxWriteCursor, box: DataInformationBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
