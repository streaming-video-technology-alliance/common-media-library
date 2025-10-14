import type { Fields } from '../boxes/Fields.ts'
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a WebVTTSourceLabelBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTSourceLabelBox
 *
 *
 * @beta
 */
export function vlab(view: IsoView): Fields<WebVttSourceLabelBox> {
	return {
		sourceLabel: view.readUtf8(-1),
	}
};
