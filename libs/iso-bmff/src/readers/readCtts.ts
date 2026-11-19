import type { CompositionOffsetBox } from '../boxes/CompositionOffsetBox.ts'
import type { CompositionOffsetEntry } from '../boxes/CompositionOffsetEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `ctts` box (`CompositionOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * A box of version 2 or above has no entries in the syntax. The result then has an empty `entries` list.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `CompositionOffsetBox`
 *
 * @public
 */
export function readCtts(cursor: IsoBoxReadCursor<IsoInt64>): CompositionOffsetBox {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const read = version === 1 ? view.readInt : view.readUint

	const entryCount = view.readUint(4)
	const entries =
		version < 2
			? view.readEntries<CompositionOffsetEntry>(entryCount, () => ({
					sampleCount: view.readUint(4),
					sampleOffset: read(4),
				}))
			: []

	return {
		type: 'ctts',
		version,
		flags,
		entryCount,
		entries,
	}
}
