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
export function readPayl(view: IsoBoxReadView): WebVttCuePayloadBox {
	return {
		type: 'payl',
		cueText: view.readUtf8(-1),
	}
};
