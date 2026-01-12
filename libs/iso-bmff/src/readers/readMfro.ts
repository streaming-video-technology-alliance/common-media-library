import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieFragmentRandomAccessOffsetBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentRandomAccessOffsetBox`
 *
 * @public
 */
export function readMfro(view: IsoBoxReadView): MovieFragmentRandomAccessOffsetBox {
	return {
		type: 'mfro',
		...view.readFullBox(),
		mfraSize: view.readUint(4),
	}
};

