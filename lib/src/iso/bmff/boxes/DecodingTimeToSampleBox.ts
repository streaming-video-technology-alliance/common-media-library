import type { FullBox } from './FullBox.js';

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
	type: 'stts';

	/** A 32-bit integer that specifies the number of entries in the decoding time-to-sample table. */
	entryCount: number;

	/** An array of decoding time-to-sample entries. */
	entries: DecodingTimeSample[];
};
