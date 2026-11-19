import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { ProtectionSchemeInfoBox } from '../boxes/ProtectionSchemeInfoBox.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `sinf` box (`ProtectionSchemeInfoBox`).
 *
 * The `writers` map does not need an entry for the `sinf` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * @param cursor - The write cursor
 * @param box - The `ProtectionSchemeInfoBox` fields to write
 *
 * @public
 */
export function writeSinf(cursor: IsoBoxWriteCursor, box: ProtectionSchemeInfoBox): void {
	writeContainerBox(cursor, box)
}
