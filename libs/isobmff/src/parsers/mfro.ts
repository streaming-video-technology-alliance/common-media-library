import type { Fields } from '../boxes/Fields.js';
import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.js';
import type { IsoView } from '../IsoView.js';

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

