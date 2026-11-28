import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { UserDataBox } from '../boxes/UserDataBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `udta` box (`UserDataBox`).
 *
 * The `writers` map does not need an entry for the `udta` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `UserDataBox` fields to write
 *
 * @public
 */
export function writeUdta(cursor: IsoBoxWriteCursor, box: UserDataBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
