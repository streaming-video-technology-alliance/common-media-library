import type { Fields } from '../boxes/types/Fields.ts'
import type { WebVttSourceLabelBox } from '../boxes/types/WebVttSourceLabelBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTTSourceLabelBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTSourceLabelBox
 *
 * @public
 */
export function readVlab(view: IsoBoxReadView): Fields<WebVttSourceLabelBox> {
	return {
		sourceLabel: view.readUtf8(-1),
	}
};
