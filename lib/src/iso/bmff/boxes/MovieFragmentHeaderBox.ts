import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd';
	sequenceNumber: number;
};
