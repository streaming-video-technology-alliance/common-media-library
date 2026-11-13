import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `DataEntryUrlBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `DataEntryUrlBox`
 *
 * @public
 */
export function readUrl(view: IsoBoxReadView<IsoInt64>): DataEntryUrlBox {
	return {
		type: 'url ',
		...view.readFullBox(),
		location: view.readUtf8(-1),
	}
}
