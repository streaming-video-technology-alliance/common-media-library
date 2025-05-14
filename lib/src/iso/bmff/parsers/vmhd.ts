import { UINT } from '../fields/UINT.ts';
import type { FullBox } from '../FullBox';
import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type VideoMediaHeaderBox = FullBox & {
	graphicsmode: number,
	opcolor: number[],
};

/**
 * Parse a VideoMediaHeaderBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed VideoMediaHeaderBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function vmhd(view: IsoView): VideoMediaHeaderBox {
	return {
		...view.readFullBox(),
		graphicsmode: view.readUint(2),
		opcolor: view.readArray(UINT, 2, 3),
	};
};
