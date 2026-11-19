import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'vttC',
		config: view.readUtf8(),
	}
}
