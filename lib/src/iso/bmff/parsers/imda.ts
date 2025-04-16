import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:2012 - 9.1.4.1 Identified media data box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IdentifiedMediaDataBox = {
	imdaIdentifier: number;
	data: Uint8Array;
};

/**
 * Parse a IdentifiedMediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed IdentifiedMediaDataBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function imda(view: IsoView): IdentifiedMediaDataBox {
	return {
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	};
};
