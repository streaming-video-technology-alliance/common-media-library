import type { FullBox } from './FullBox.js';

/**
 * Movie Fragment Random Access Offset Box - 'mfro'
 */
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
	type: 'mfro';
	mfraSize: number;
};
