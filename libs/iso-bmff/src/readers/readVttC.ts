import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUtf8 } from '../cursor/readUtf8.ts'

/**
 * Read the `vttC` box (`WebVttConfigurationBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `WebVttConfigurationBox`
 *
 * @public
 */
export function readVttC(cursor: IsoBoxReadCursor<IsoInt64>): WebVttConfigurationBox {
	return {
		type: 'vttC',
		config: readUtf8(cursor, cursor.end - cursor.pos),
	}
}
