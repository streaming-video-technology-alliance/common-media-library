import type { MediaBox, MediaBoxChild } from '../boxes/MediaBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MediaBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `mdia` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MediaBox`
 *
 * @public
 */
export function readMdia(view: IsoBoxReadView): MediaBox {
	return {
		type: 'mdia',
		boxes: view.readBoxes<MediaBoxChild>(),
	}
}
