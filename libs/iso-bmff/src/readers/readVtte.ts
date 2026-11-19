import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `vtte` box (`WebVttEmptySampleBox`).
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
export function readVtte(_cursor: IsoBoxReadCursor<IsoInt64>): WebVttEmptySampleBox {
	return {
		type: 'vtte',
	}
}
