import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'

/**
 * Write the `imda` box (`IdentifiedMediaDataBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `IdentifiedMediaDataBox` fields to write
 *
 * @public
 */
export function writeImda(cursor: IsoBoxWriteCursor, box: IdentifiedMediaDataBox): void {
	const start = beginIsoBox(cursor, 'imda')
	writeUint32(cursor, box.imdaIdentifier)
	writeBytes(cursor, box.data)
	endIsoBox(cursor, start)
}
