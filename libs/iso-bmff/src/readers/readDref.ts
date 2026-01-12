import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `DataReferenceBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `DataReferenceBox`
 *
 * @public
 */
export function readDref(view: IsoBoxReadView): DataReferenceBox {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)
	const entries = view.readBoxes<DataEntryUrlBox | DataEntryUrnBox>(entryCount)

	return {
		type: 'dref',
		version,
		flags,
		entryCount,
		entries,
	}
};
