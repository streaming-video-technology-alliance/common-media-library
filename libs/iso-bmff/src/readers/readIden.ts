import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `WebVttCueIdBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttCueIdBox`
 *
 * @public
 */
export function readIden(view: IsoBoxReadView): WebVttCueIdBox {
	return {
		type: 'iden',
		cueId: view.readUtf8(-1),
	}
};
