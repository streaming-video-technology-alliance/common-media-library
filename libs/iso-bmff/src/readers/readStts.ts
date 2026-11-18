import type { TimeToSampleBox } from '../boxes/TimeToSampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stts` box (`TimeToSampleBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `TimeToSampleBox`
 *
 * @public
 */
export function readStts(view: IsoBoxReadView<IsoInt64>): TimeToSampleBox {
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
