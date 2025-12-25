import type { Fields } from '../boxes/Fields.ts'
import type { WebVttSettingsBox } from '../boxes/WebVttSettingsBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTTSettingsBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTSettingsBox
 *
 *
 * @beta
 */
export function sttg(view: IsoBoxReadView): Fields<WebVttSettingsBox> {
	return {
		settings: view.readUtf8(-1),
	}
};
