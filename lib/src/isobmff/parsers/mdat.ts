import type { IsoView } from '../IsoView.js';

export type DataBox = {
	data: Uint8Array;
}

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MediaDataBox = DataBox;

/**
 * Parse a MediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MediaDataBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function mdat(view: IsoView): MediaDataBox {
	return {
		data: view.readData(-1),
	};
};
