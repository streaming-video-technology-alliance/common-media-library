import type { Fields } from '../boxes/Fields.ts'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTTCueIdBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCueIdBox
 *
 *
 * @beta
 */
export function iden(view: IsoBoxReadView): Fields<WebVttCueIdBox> {
	return {
		cueId: view.readUtf8(-1),
	}
};
