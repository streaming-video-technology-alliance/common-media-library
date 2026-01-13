import type { SyncSample } from '../boxes/SyncSample.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SyncSampleBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SyncSampleBox`
 *
 * @public
 */
export function readStss(view: IsoBoxReadView): SyncSampleBox {
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
};
