import type { CompositionTimeToSampleBox } from '../boxes/CompositionTimeToSampleBox.js';
import type { CompositionTimeToSampleEntry } from '../boxes/CompositionTimeToSampleEntry.js';
import type { Fields } from '../boxes/Fields.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a CompositionTimeToSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed CompositionTimeToSampleBox
 *
 *
 * @beta
 */
export function ctts(view: IsoView): Fields<CompositionTimeToSampleBox> {
	const { version, flags } = view.readFullBox();
	const read = version === 1 ? view.readInt : view.readUint;

	const entryCount = view.readUint(4);
	const entries = view.readEntries<CompositionTimeToSampleEntry>(entryCount, () => ({
		sampleCount: view.readUint(4),
		sampleOffset: read(4),
	}));

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
