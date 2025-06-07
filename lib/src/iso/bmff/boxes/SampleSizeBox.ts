import type { FullBox } from './FullBox.js';

/**
 * Sample Size Box - 'stsz'
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz';
	sampleSize: number;
	sampleCount: number;
	entrySize?: number[];
};
