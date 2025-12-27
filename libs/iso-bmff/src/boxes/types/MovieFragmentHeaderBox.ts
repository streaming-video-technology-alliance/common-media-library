import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 *
 * @public
 */
export type MovieFragmentHeaderBox = FullBox & {
	type: 'mfhd';
	sequenceNumber: number;
};
