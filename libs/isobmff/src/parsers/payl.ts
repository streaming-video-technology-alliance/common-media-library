import type { Fields } from '../boxes/Fields.js';
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a WebVTTCuePayloadBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCuePayloadBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function payl(view: IsoView): Fields<WebVttCuePayloadBox> {
	return {
		cueText: view.readUtf8(-1),
	};
};
