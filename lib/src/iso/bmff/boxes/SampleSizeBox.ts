import type { FullBox } from './FullBox.js';

/**
 * Sample Size Box - 'stsz'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleSizeBox = FullBox & {
	type: 'stsz';
	sampleSize: number;
	sampleCount: number;
	entrySize?: number[];
};
