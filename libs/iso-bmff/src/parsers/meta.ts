import type { Fields } from '../boxes/Fields.ts';
import type { MetaBox } from '../boxes/MetaBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a MetaBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MetaBox
 *
 *
 * @beta
 */
export function meta(view: IsoView): Fields<MetaBox> {
	return view.readFullBox();
};
