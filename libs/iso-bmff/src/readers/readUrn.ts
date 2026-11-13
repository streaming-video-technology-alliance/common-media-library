import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `DataEntryUrnBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `DataEntryUrnBox`
 *
 * @public
 */
export function readUrn(view: IsoBoxReadView<IsoInt64>): DataEntryUrnBox {
	return {
		type: 'urn ',
		...view.readFullBox(),
		name: view.readUtf8(-1),
		location: view.readUtf8(-1),
	}
}
