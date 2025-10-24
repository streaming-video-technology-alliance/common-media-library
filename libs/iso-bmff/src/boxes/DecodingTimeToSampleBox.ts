import type { DecodingTimeSample } from './DecodingTimeSample.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.2 Decoding Time To Sample Box
 *
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
