import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'payl',
		cueText: view.readUtf8(-1),
	}
}
