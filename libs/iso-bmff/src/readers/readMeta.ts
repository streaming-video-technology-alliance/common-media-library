import type { Fields } from '../boxes/Fields.ts'
import type { MetaBox } from '../boxes/MetaBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a MetaBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed MetaBox
 *
 * @public
 */
export function readMeta(view: IsoBoxReadView): Fields<MetaBox> {
	return view.readFullBox()
};
