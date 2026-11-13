import type { SyncSample } from '../boxes/SyncSample.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `SyncSampleBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SyncSampleBox`
 *
 * @public
 */
export function readStss(view: IsoBoxReadView<IsoInt64>): SyncSampleBox {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		type: 'stss',
		version,
		flags,
		entryCount,
		entries: view.readEntries<SyncSample>(entryCount, () => ({
			sampleNumber: view.readUint(4),
		})),
	}
}
