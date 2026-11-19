import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'sttg',
		settings: view.readUtf8(-1),
	}
}
