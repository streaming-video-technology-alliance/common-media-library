import type { FullBox } from './FullBox.js';

/**
 * Compact Sample Size Box - 'stz2'
 *
 *
 * @beta
 */
export type CompactSampleSizeBox = FullBox & {
	type: 'stz2';
	fieldSize: number;
	sampleCount: number;
	entrySize: number[];
};
