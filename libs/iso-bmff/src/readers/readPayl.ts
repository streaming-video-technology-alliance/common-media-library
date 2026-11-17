import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `payl` box (`WebVttCuePayloadBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttCuePayloadBox`
 *
 * @public
 */
export function readPayl(view: IsoBoxReadView<IsoInt64>): WebVttCuePayloadBox {
	return {
		type: 'payl',
		cueText: view.readUtf8(-1),
	}
}
