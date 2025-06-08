import type { Fields } from '../boxes/Fields.js';
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a WebVTTSourceLabelBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTSourceLabelBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function vlab(view: IsoView): Fields<WebVttSourceLabelBox> {
	return {
		sourceLabel: view.readUtf8(-1),
	};
};
