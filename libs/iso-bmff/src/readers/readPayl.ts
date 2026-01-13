import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `WebVttCuePayloadBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttCuePayloadBox`
 *
 * @public
 */
export function readPayl(view: IsoBoxReadView): WebVttCuePayloadBox {
	return {
		type: 'payl',
		cueText: view.readUtf8(-1),
	}
};
