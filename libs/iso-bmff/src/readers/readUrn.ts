import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `DataEntryUrnBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `DataEntryUrnBox`
 *
 * @public
 */
export function readUrn(view: IsoBoxReadView): DataEntryUrnBox {
	return {
		type: 'urn ',
		...view.readFullBox(),
		name: view.readString(-1),
		location: view.readString(-1),
	}
};
