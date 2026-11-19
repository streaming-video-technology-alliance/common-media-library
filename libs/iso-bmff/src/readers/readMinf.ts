import type { MediaInformationBox } from '../boxes/MediaInformationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
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
export function readMinf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MediaInformationBox<V> {
	return {
		type: 'minf',
		boxes: readChildBoxes(cursor),
	}
}
