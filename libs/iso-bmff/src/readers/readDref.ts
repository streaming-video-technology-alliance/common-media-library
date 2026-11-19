import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `dref` box (`DataReferenceBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `DataReferenceBox`
 *
 * @public
 */
export function readDref<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): DataReferenceBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)
	const boxes = view.readBoxes<DataEntryUrlBox | DataEntryUrnBox>(entryCount)

	return {
		type: 'dref',
		version,
		flags,
		entryCount,
		boxes,
	}
}
