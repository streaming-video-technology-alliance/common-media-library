import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'iden',
		cueId: view.readUtf8(-1),
	}
}
