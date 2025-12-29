import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a MovieFragmentRandomAccessBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieFragmentRandomAccessBox
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

