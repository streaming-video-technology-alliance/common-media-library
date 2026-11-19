import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUtf8 } from '../cursor/readUtf8.ts'

/**
 * Read the `payl` box (`WebVttCuePayloadBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `WebVttCuePayloadBox`
 *
 * @public
 */
export function readPayl(cursor: IsoBoxReadCursor<IsoInt64>): WebVttCuePayloadBox {
	return {
		type: 'payl',
		cueText: readUtf8(cursor, cursor.end - cursor.pos),
	}
}
