import type { IsoInt64 } from '../IsoInt64.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SchemeInformationBox } from '../boxes/SchemeInformationBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `schi` box (`SchemeInformationBox`).
 *
 * The `writers` map does not need an entry for the `schi` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `SchemeInformationBox` fields to write
 *
 * @public
 */
export function writeSchi(cursor: IsoBoxWriteCursor, box: SchemeInformationBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
