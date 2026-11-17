import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `WebVttEmptySampleBox` from an `IsoBoxReadView`.
 *
 * The box has no fields, so the function reads no bytes from the view.
 *
 * @param _view - The view to read from
 *
 * @returns A parsed `WebVttEmptySampleBox`
 *
 * @public
 */
// oxlint-disable-next-line no-unused-vars
export function readVtte(_view: IsoBoxReadView<IsoInt64>): WebVttEmptySampleBox {
	return {
		type: 'vtte',
	}
}
