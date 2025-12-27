import type { Fields } from '../boxes/Fields.ts'
import type { UrlBox } from '../boxes/UrlBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a UrlBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrlBox
 *
 * @public
 */
export function readUrl(view: IsoBoxReadView): Fields<UrlBox> {
	return {
		...view.readFullBox(),
		location: view.readString(-1),
	}
};
