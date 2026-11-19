import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'vlab',
		sourceLabel: view.readUtf8(-1),
	}
}
