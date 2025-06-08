import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
	type: 'mfro';
	mfraSize: number;
};
