import type { EditListBox } from '../boxes/EditListBox.ts'
import type { EditListEntry } from '../boxes/EditListEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `EditListBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `EditListBox`
 *
 * @public
 */
export function readElst<V extends IsoInt64>(view: IsoBoxReadView<V>): EditListBox<V> {
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
