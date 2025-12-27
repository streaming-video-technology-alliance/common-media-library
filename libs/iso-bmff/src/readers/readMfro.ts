import type { Fields } from '../boxes/Fields.ts'
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
export function readMfro(view: IsoBoxReadView): Fields<MovieFragmentRandomAccessOffsetBox> {
	return {
		...view.readFullBox(),
		mfraSize: view.readUint(4),
	}
};

