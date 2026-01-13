import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `WebVttEmptySampleBox` from an `IsoBoxReadView`.
 *
 * @returns A parsed `WebVttEmptySampleBox`
 *
 * @public
 */
// eslint-disable-next-line
export function readVtte(_: IsoBoxReadView): WebVttEmptySampleBox {
	// Nothing should happen here.
	return {
		type: 'vtte',
	}
};
