import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
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
export function readVlab(view: IsoBoxReadView): WebVttSourceLabelBox {
	return {
		type: 'vlab',
		sourceLabel: view.readUtf8(-1),
	}
};
