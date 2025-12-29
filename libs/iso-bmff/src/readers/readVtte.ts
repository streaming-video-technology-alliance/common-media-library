import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a WebVTT Empty Sample Box from an IsoView
 *
 * @returns A parsed WebVTT Empty Sample Box
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
