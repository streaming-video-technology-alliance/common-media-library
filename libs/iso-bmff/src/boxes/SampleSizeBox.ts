import type { FullBox } from './FullBox.ts'

/**
 * Sample Size Box - 'stsz'
 *
 * @public
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz';
	sampleSize: number;
	sampleCount: number;
	entrySize?: number[];
};

/**
 * @public
 */
export type stsz = SampleSizeBox;
