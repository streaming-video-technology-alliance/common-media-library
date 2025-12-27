import type { Fields } from '../boxes/Fields.ts'
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTTCuePayloadBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCuePayloadBox
 *
 * @public
 */
export function readPayl(view: IsoBoxReadView): Fields<WebVttCuePayloadBox> {
	return {
		cueText: view.readUtf8(-1),
	}
};
