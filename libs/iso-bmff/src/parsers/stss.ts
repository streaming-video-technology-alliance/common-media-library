import type { Fields } from '../boxes/Fields.ts';
import type { SyncSample } from '../boxes/SyncSample.ts';
import type { SyncSampleBox } from '../boxes/SyncSampleBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a SyncSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SyncSampleBox
 *
 *
 * @beta
 */
export function stss(view: IsoView): Fields<SyncSampleBox> {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);

	return {
		version,
		flags,
		entryCount,
		entries: view.readEntries<SyncSample>(entryCount, () => ({
			sampleNumber: view.readUint(4),
		})),
	};
};
