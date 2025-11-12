import type { FullBox } from './FullBox.ts'

/**
 * Compact Sample Size Box - 'stz2'
 *
 *
 * @beta
 */
export type CompactSampleSizeBox = FullBox<'stz2'> & {
	fieldSize: number;
	sampleCount: number;
	entrySize: number[];
};
