import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type UrnBox = FullBox & {
	name: string;
	location: string;
};

/**
 * Parse a UrnBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrnBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function urn(view: IsoView): UrnBox {
	return {
		...view.readFullBox(),
		name: view.readString(-1),
		location: view.readString(-1),
	};
};
