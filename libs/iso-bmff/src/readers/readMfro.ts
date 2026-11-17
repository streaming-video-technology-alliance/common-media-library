import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mfro` box (`MovieFragmentRandomAccessOffsetBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentRandomAccessOffsetBox`
 *
 * @public
 */
export function readMfro(view: IsoBoxReadView<IsoInt64>): MovieFragmentRandomAccessOffsetBox {
	return {
		type: 'mfro',
		...view.readFullBox(),
		mfraSize: view.readUint(4),
	}
}
