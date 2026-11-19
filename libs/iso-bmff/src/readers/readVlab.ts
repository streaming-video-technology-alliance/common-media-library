import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUtf8 } from '../cursor/readUtf8.ts'

/**
 * Read the `vlab` box (`WebVttSourceLabelBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `WebVttSourceLabelBox`
 *
 * @example
 * {@includeCode ../../test/readers/readVlab.test.ts#example}
 *
 * @public
 */
export function readVlab(cursor: IsoBoxReadCursor<IsoInt64>): WebVttSourceLabelBox {
	return {
		type: 'vlab',
		sourceLabel: readUtf8(cursor, cursor.end - cursor.pos),
	}
}
