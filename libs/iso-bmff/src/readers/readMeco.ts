import type { AdditionalMetadataContainerBox } from '../boxes/AdditionalMetadataContainerBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `meco` box (`AdditionalMetadataContainerBox`).
 *
 * The `readers` map does not need an entry for the `meco` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `AdditionalMetadataContainerBox`
 *
 * @public
 */
export function readMeco<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): AdditionalMetadataContainerBox<V> {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'meco',
		boxes: view.readBoxes(),
	}
}
