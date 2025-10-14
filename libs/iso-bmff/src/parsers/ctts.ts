import type { CompositionTimeToSampleBox } from '../boxes/CompositionTimeToSampleBox.ts';
import type { CompositionTimeToSampleEntry } from '../boxes/CompositionTimeToSampleEntry.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { IsoView } from '../IsoView.ts';

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
