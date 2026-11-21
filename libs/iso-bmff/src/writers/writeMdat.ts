import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { MediaDataBox } from '../boxes/MediaDataBox.ts'

/**
 * Write the `mdat` box (`MediaDataBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.1
 *
 * @param cursor - The write cursor
 * @param box - The `MediaDataBox` fields to write
 *
 * @public
 */
export function writeMdat(cursor: IsoBoxWriteCursor, box: MediaDataBox): void {
	const start = beginIsoBox(cursor, 'mdat')
	writeBytes(cursor, box.data)
	endIsoBox(cursor, start)
}
