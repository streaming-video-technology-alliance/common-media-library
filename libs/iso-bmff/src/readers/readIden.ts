import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUtf8 } from '../cursor/readUtf8.ts'

/**
 * Read the `iden` box (`WebVttCueIdBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `WebVttCueIdBox`
 *
 * @public
 */
export function readIden(cursor: IsoBoxReadCursor<IsoInt64>): WebVttCueIdBox {
	return {
		type: 'iden',
		cueId: readUtf8(cursor, cursor.end - cursor.pos),
	}
}
