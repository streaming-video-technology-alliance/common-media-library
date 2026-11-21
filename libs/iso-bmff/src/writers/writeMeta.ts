import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import type { MetaBox } from '../boxes/MetaBox.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Write the `meta` box (`MetaBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.1
 *
 * The writer writes the child boxes with the writers of the cursor.
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param cursor - The write cursor
 * @param box - The `MetaBox` fields to write
 *
 * @public
 */
export function writeMeta(cursor: IsoBoxWriteCursor, box: MetaBox<IsoInt64>): void {
	const start = beginIsoFullBox(cursor, 'meta', box.version, box.flags)

	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
