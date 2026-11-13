import type { WebVttCueBox, WebVttCueChild } from '../boxes/WebVttCueBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `WebVttCueBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `vttc` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttCueBox`
 *
 * @public
 */
export function readVttc(view: IsoBoxReadView): WebVttCueBox {
	return {
		type: 'vttc',
		boxes: view.readBoxes<WebVttCueChild>(),
	}
}
