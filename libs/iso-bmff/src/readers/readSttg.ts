import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `WebVttSettingsBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttSettingsBox`
 *
 * @public
 */
export function readSttg(view: IsoBoxReadView): WebVttSettingsBox {
	return {
		type: 'sttg',
		settings: view.readUtf8(-1),
	}
};
