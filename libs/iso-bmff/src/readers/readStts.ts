import type { TimeToSampleBox } from '../boxes/TimeToSampleBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stts` box (`TimeToSampleBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TimeToSampleBox`
 *
 * @public
 */
export function readStts(cursor: IsoBoxReadCursor<IsoInt64>): TimeToSampleBox {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)
	const entries = view.readEntries(entryCount, () => ({
		sampleCount: view.readUint(4),
		sampleDelta: view.readUint(4),
	}))

	return {
		type: 'stts',
		version,
		flags,
		entryCount,
		entries,
	}
}
