import type { FullBox } from './FullBox.js';

/**
 * Movie Fragment Header Box - 'mfhd'
 */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd';
	sequenceNumber: number;
};
