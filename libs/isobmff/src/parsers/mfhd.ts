import type { Fields } from '../boxes/Fields.js';
import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a MovieFragmentHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieFragmentHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mfhd(view: IsoView): Fields<MovieFragmentHeaderBox> {
	return {
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	};
};
