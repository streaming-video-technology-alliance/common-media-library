import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView';

/**
 * Track fragment random access entry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentRandomAccessEntry = {
	time: number;
	moofOffset: number;
	trafNumber: number;
	trunNumber: number;
	sampleNumber: number;
}

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentRandomAccessBox = FullBox & {
	trackId: number;
	reserved: number;
	numberOfEntry: number;
	lengthSizeOfTrafNum: number;
	lengthSizeOfTrunNum: number;
	lengthSizeOfSampleNum: number;
	entries: TrackFragmentRandomAccessEntry[];
};

/**
 * Parse a TrackFragmentRandomAccessBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed TrackFragmentRandomAccessBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function tfra(view: IsoView): TrackFragmentRandomAccessBox {
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
