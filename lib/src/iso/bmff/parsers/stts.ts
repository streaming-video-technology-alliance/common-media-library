import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DecodingTimeSample = {
	/** A 32-bit integer that specifies the number of consecutive samples that have the same decoding time delta. */
	sampleCount: number;

	/** A 32-bit integer that specifies the delta of the decoding time of each sample in the table. */
	sampleDelta: number;
};

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DecodingTimeToSampleBox = FullBox & {
	/** A 32-bit integer that specifies the number of entries in the decoding time-to-sample table. */
	entryCount: number;

	/** An array of decoding time-to-sample entries. */
	entries: DecodingTimeSample[];
};

/**
 * Parse a DecodingTimeToSampleBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed DecodingTimeToSampleBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function stts(view: IsoView): DecodingTimeToSampleBox {
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
