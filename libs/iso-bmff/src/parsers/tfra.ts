import type { Fields } from '../boxes/Fields.ts';
import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts';
import type { TrackFragmentRandomAccessEntry } from '../boxes/TrackFragmentRandomAccessEntry.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a TrackFragmentRandomAccessBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentRandomAccessBox
 *
 *
 * @beta
 */
export function tfra(view: IsoView): Fields<TrackFragmentRandomAccessBox> {
	const { version, flags } = view.readFullBox();
	const trackId = view.readUint(4);
	const reserved = view.readUint(4);

	const lengthSizeOfTrafNum = (reserved & 0x00000030) >> 4;
	const lengthSizeOfTrunNum = (reserved & 0x0000000C) >> 2;
	const lengthSizeOfSampleNum = (reserved & 0x00000003);

	const numberOfEntry = view.readUint(4);

	const entries = view.readEntries<TrackFragmentRandomAccessEntry>(numberOfEntry, () => ({
		time: view.readUint((version === 1) ? 8 : 4),
		moofOffset: view.readUint((version === 1) ? 8 : 4),
		trafNumber: view.readUint(lengthSizeOfTrafNum + 1),
		trunNumber: view.readUint(lengthSizeOfTrunNum + 1),
		sampleNumber: view.readUint(lengthSizeOfSampleNum + 1),
	}));

	return {
		version,
		flags,
		trackId,
		reserved,
		lengthSizeOfTrafNum,
		lengthSizeOfTrunNum,
		lengthSizeOfSampleNum,
		numberOfEntry,
		entries,
	};
};
