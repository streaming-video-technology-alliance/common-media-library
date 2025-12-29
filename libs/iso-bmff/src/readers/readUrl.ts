import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
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
export function readUrl(view: IsoBoxReadView): DataEntryUrlBox {
	return {
		type: 'url ',
		...view.readFullBox(),
		location: view.readString(-1),
	}
};
