import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { GroupsListBox } from '../boxes/GroupsListBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeContainerBox } from '../utils/writeContainerBox.ts'

/**
 * Write the `grpl` box (`GroupsListBox`).
 *
 * The `writers` map does not need an entry for the `grpl` box type.
 * `writeIsoBoxes` writes the same bytes with this writer and without this writer.
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `GroupsListBox` fields to write
 *
 * @public
 */
export function writeGrpl(cursor: IsoBoxWriteCursor, box: GroupsListBox<IsoInt64>): void {
	writeContainerBox(cursor, box)
}
