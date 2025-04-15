import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentRandomAccessBox = FullBox & {
	mfra_size: number;
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
		mfra_size: view.readUint(4),
	};
};

