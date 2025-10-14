import type { Fields } from '../boxes/Fields.ts';
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a WebVTTCuePayloadBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCuePayloadBox
 *
 *
 * @beta
 */
export function payl(view: IsoView): Fields<WebVttCuePayloadBox> {
	return {
		cueText: view.readUtf8(-1),
	};
};
