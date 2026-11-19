import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readBytes } from '../cursor/readBytes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `free` box (`FreeSpaceBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `FreeSpaceBox`
 *
 * @public
 */
export function readFree(cursor: IsoBoxReadCursor<IsoInt64>): FreeSpaceBox {
	return {
		type: 'free',
		data: readBytes(cursor, cursor.end - cursor.pos),
	}
}
