import type { FullBox } from './FullBox.ts'

/**
 * Sample Size Box - 'stsz'
 *
 *
 * @beta
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz';
	sampleSize: number;
	sampleCount: number;
	entrySize?: number[];
};
