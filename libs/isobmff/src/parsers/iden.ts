import type { Fields } from '../boxes/Fields.js';
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a WebVTTCueIdBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCueIdBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function iden(view: IsoView): Fields<WebVttCueIdBox> {
	return {
		cueId: view.readUtf8(-1),
	};
};
