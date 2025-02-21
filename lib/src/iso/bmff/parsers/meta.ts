import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-12:202x - 8.11.1 Meta box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MetaBox = FullBox;

/**
 * Parse a MetaBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MetaBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function meta(view: IsoView): MetaBox {
	return view.readFullBox();
};
