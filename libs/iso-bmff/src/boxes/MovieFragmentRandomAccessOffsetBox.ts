import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 *
 *
 * @beta
 */
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
	type: 'mfro';
	mfraSize: number;
};
