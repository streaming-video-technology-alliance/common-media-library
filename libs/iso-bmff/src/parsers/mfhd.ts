import type { Fields } from '../boxes/Fields.ts';
import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a MovieFragmentHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieFragmentHeaderBox
 *
 *
 * @beta
 */
export function mfhd(view: IsoView): Fields<MovieFragmentHeaderBox> {
	return {
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	};
};
