import type { FullBox } from './FullBox.ts'

/**
 * Compact Sample Size Box - 'stz2'
 *
 * @public
 */
export type CompactSampleSizeBox = FullBox & {
	type: 'stz2';
	fieldSize: number;
	sampleCount: number;
	entrySize: number[];
};

/**
 * @public
 */
export type stz2 = CompactSampleSizeBox;
