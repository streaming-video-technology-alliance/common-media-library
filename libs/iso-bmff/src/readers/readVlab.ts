import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `WebVttSourceLabelBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttSourceLabelBox`
 *
 * @public
 */
export function readVlab(view: IsoBoxReadView): WebVttSourceLabelBox {
	return {
		type: 'vlab',
		sourceLabel: view.readUtf8(-1),
	}
};
