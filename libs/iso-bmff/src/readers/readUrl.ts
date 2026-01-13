import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `DataEntryUrlBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `DataEntryUrlBox`
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
