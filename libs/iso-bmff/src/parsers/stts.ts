import type { DecodingTimeToSampleBox } from '../boxes/DecodingTimeToSampleBox.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a DecodingTimeToSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed DecodingTimeToSampleBox
 *
 *
 * @beta
 */
export function stts(view: IsoView): Fields<DecodingTimeToSampleBox> {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);
	const entries = view.readEntries(entryCount, () => ({
		sampleCount: view.readUint(4),
		sampleDelta: view.readUint(4),
	}));

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
