import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `WebVttEmptySampleBox` from an `IsoBoxReadView`.
 *
 * @returns A parsed `WebVttEmptySampleBox`
 *
 * @public
 */
// eslint-disable-next-line
export function readVtte(_: IsoBoxReadView<IsoInt64>): WebVttEmptySampleBox {
	// Nothing should happen here.
	return {
		type: 'vtte',
	}
}
