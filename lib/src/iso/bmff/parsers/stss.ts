import type { Fields } from '../boxes/Fields.js';
import type { SyncSample } from '../boxes/SyncSample.js';
import type { SyncSampleBox } from '../boxes/SyncSampleBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a SyncSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed SyncSampleBox
 *
 * @group ISOBMFF
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
