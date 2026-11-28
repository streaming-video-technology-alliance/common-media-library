import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { RestrictedSchemeInfoBox } from '../boxes/RestrictedSchemeInfoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `rinf` box (`RestrictedSchemeInfoBox`).
 *
 * The `writers` map does not need an entry for the `rinf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `RestrictedSchemeInfoBox` fields to write
 *
 * @public
 */
export function writeRinf(cursor: IsoBoxWriteCursor, box: RestrictedSchemeInfoBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
