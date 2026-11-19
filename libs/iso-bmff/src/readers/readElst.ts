import type { EditListBox } from '../boxes/EditListBox.ts'
import type { EditListEntry } from '../boxes/EditListEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `elst` box (`EditListBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `EditListBox`
 *
 * @public
 */
export function readElst<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditListBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const v1 = version === 1
	const size = v1 ? 8 : 4

	const entryCount = view.readUint(4)
	const entries = view.readEntries<EditListEntry<V>>(entryCount, () => ({
		segmentDuration: view.readWideUint(size),
		mediaTime: view.readWideInt(size),
		mediaRateInteger: view.readInt(2),
		mediaRateFraction: view.readInt(2),
	}))

	return {
		type: 'elst',
		version,
		flags,
		entryCount,
		entries,
	}
}
