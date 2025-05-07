import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * A Composition Time To Sample Entry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type CompositionTimeToSampleEntry = {
	sampleCount: number;
	sampleOffset: number;
};

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type CompositionTimeToSampleBox = FullBox & {
	entryCount: number;
	entries: CompositionTimeToSampleEntry[];
};

/**
 * Parse a CompositionTimeToSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed CompositionTimeToSampleBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function ctts(view: IsoView): CompositionTimeToSampleBox {
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
