import type { MediaInformationBox, MediaInformationBoxChild } from '../boxes/MediaInformationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MediaInformationBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `minf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MediaInformationBox`
 *
 * @public
 */
export function readMinf(view: IsoBoxReadView<IsoInt64>): MediaInformationBox {
	return {
		type: 'minf',
		boxes: view.readBoxes<MediaInformationBoxChild>(),
	}
}
