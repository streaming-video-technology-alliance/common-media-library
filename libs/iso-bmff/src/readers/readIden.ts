import type { Fields } from '../boxes/types/Fields.ts'
import type { WebVttCueIdBox } from '../boxes/types/WebVttCueIdBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTTCueIdBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCueIdBox
 *
 * @public
 */
export function readIden(view: IsoBoxReadView): Fields<WebVttCueIdBox> {
	return {
		cueId: view.readUtf8(-1),
	}
};
