import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type UrlBox = FullBox & {
	location: string;
};

/**
 * Parse a UrlBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrlBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function url(view: IsoView): UrlBox {
	return {
		...view.readFullBox(),
		location: view.readString(-1),
	};
};
