import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readBytes } from '../cursor/readBytes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mdat` box (`MediaDataBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MediaDataBox`
 *
 * @public
 */
export function readMdat(cursor: IsoBoxReadCursor<IsoInt64>): MediaDataBox {
	return {
		type: 'mdat',
		data: readBytes(cursor, cursor.end - cursor.pos),
	}
}
