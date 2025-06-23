import type { Fields } from '../boxes/Fields.js';
import type { MetaBox } from '../boxes/MetaBox.js';
import type { IsoView } from '../IsoView.js';

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
export function meta(view: IsoView): Fields<MetaBox> {
	return view.readFullBox();
};
