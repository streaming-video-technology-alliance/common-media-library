import type { Fields } from '../boxes/Fields.ts'
import type { SyncSample } from '../boxes/SyncSample.ts'
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a SyncSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SyncSampleBox
 *
 * @public
 */
export function readStss(view: IsoBoxReadView): Fields<SyncSampleBox> {
	const { version, flags } = view.readFullBox()
	const entryCount = view.readUint(4)

	return {
		version,
		flags,
		entryCount,
		entries: view.readEntries<SyncSample>(entryCount, () => ({
			sampleNumber: view.readUint(4),
		})),
	}
};
