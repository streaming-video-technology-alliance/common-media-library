import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `WebVttCueIdBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttCueIdBox`
 *
 * @public
 */
export function readIden(view: IsoBoxReadView<IsoInt64>): WebVttCueIdBox {
	return {
		type: 'iden',
		cueId: view.readUtf8(-1),
	}
}
