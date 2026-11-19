import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Write the `dref` box (`DataReferenceBox`).
 *
 * The writer writes the data entries with the writers of the cursor.
 *
 * @param cursor - The write cursor
 * @param box - The `DataReferenceBox` fields to write
 *
 * @public
 */
export function writeDref(cursor: IsoBoxWriteCursor, box: DataReferenceBox): void {
	const start = beginIsoFullBox(cursor, 'dref', box.version, box.flags)

	writeUint32(cursor, box.boxes.length)
	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
