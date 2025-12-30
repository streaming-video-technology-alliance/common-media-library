import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
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
export function readIden(view: IsoBoxReadView): WebVttCueIdBox {
	return {
		type: 'iden',
		cueId: view.readUtf8(-1),
	}
};
