import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { EditBox } from '../boxes/EditBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `edts` box (`EditBox`).
 *
 * The `writers` map does not need an entry for the `edts` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `EditBox` fields to write
 *
 * @public
 */
export function writeEdts(cursor: IsoBoxWriteCursor, box: EditBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
