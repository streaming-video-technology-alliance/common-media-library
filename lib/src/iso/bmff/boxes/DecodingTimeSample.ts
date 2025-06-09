/**
 * Decoding time sample
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
