import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUtf8 } from '../cursor/readUtf8.ts'

/**
 * Read the `sttg` box (`WebVttSettingsBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `WebVttSettingsBox`
 *
 * @public
 */
export function readSttg(cursor: IsoBoxReadCursor<IsoInt64>): WebVttSettingsBox {
	return {
		type: 'sttg',
		settings: readUtf8(cursor, cursor.end - cursor.pos),
	}
}
