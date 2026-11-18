import type { CompositionOffsetBox } from '../boxes/CompositionOffsetBox.ts'
import type { CompositionOffsetEntry } from '../boxes/CompositionOffsetEntry.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `ctts` box (`CompositionOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * A box of version 2 or above has no entries in the syntax. The result then has an empty `entries` list.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `CompositionOffsetBox`
 *
 * @public
 */
export function readCtts(view: IsoBoxReadView<IsoInt64>): CompositionOffsetBox {
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
