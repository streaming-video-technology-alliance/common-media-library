import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mfro` box (`MovieFragmentRandomAccessOffsetBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieFragmentRandomAccessOffsetBox`
 *
 * @public
 */
export function readMfro(cursor: IsoBoxReadCursor<IsoInt64>): MovieFragmentRandomAccessOffsetBox {
	const view = new IsoBoxReadView(cursor)

	return {
		type: 'mfro',
		...view.readFullBox(),
		mfraSize: view.readUint(4),
	}
}
