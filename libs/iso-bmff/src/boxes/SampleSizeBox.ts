import type { FullBox } from './FullBox.ts'

/**
 * Sample Size Box (`stsz`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @public
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz'
	sampleSize: number
	/**
	 * The number of samples of a box with a `sampleSize` above 0.
	 * With a `sampleSize` of 0, the reader omits the field, and the number of samples is the length of `entrySize`.
	 */
	sampleCount?: number
	/** The size of each sample, for a box with a `sampleSize` of 0. */
	entrySize?: number[]
}
