import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentRandomAccessBox = FullBox & {
	size: number;
}

/**
 * Parse a MovieFragmentRandomAccessBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MovieFragmentRandomAccessBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mfro(view: IsoView): MovieFragmentRandomAccessBox {
	return {
		...view.readFullBox(),
		size: view.readUint(4),
	};
};

