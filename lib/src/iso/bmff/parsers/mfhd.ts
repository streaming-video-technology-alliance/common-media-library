import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentHeaderBox = FullBox & {
	sequenceNumber: number;
};

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
export function mfhd(view: IsoView): MovieFragmentHeaderBox {
	return {
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	};
};
