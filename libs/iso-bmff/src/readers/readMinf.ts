import type { MediaInformationBox, MediaInformationBoxChild } from '../boxes/MediaInformationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `minf` box (`MediaInformationBox`).
 *
 * The `readers` map does not need an entry for the `minf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MediaInformationBox`
 *
 * @public
 */
export function readMinf(cursor: IsoBoxReadCursor<IsoInt64>): MediaInformationBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'minf',
		boxes: view.readBoxes<MediaInformationBoxChild>(),
	}
}
