import type { Fields } from '../boxes/Fields.ts';
import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a MovieFragmentRandomAccessBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieFragmentRandomAccessBox
 *
 *
 * @beta
 */
export function mfro(view: IsoView): Fields<MovieFragmentRandomAccessOffsetBox> {
	return {
		...view.readFullBox(),
		mfraSize: view.readUint(4),
	};
};

