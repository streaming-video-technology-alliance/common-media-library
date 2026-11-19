import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mfhd` box (`MovieFragmentHeaderBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieFragmentHeaderBox`
 *
 * @public
 */
export function readMfhd(cursor: IsoBoxReadCursor<IsoInt64>): MovieFragmentHeaderBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'mfhd',
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	}
}
