import type { Fields } from '../boxes/Fields.ts'
import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a MovieFragmentHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieFragmentHeaderBox
 *
 * @public
 */
export function readMfhd(view: IsoBoxReadView): Fields<MovieFragmentHeaderBox> {
	return {
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	}
};
