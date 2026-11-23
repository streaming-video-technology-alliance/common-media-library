import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'

/**
 * Write the `skip` box (`FreeSpaceBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.2
 *
 * @param cursor - The write cursor
 * @param box - The `FreeSpaceBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeSkip(cursor: IsoBoxWriteCursor, box: FreeSpaceBox<'skip'>): void {
	const start = beginIsoBox(cursor, 'skip')
	writeBytes(cursor, box.data)
	endIsoBox(cursor, start)
}
