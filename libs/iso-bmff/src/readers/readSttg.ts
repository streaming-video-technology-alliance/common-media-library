import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `sttg` box (`WebVttSettingsBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttSettingsBox`
 *
 * @public
 */
export function readSttg(view: IsoBoxReadView<IsoInt64>): WebVttSettingsBox {
	return {
		type: 'sttg',
		settings: view.readUtf8(-1),
	}
}
