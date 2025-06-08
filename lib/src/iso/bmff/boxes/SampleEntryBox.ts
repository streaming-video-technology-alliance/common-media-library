import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-12:2015 - 8.5.2.2 Sample Entry
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleEntryBox = Box & {
	reserved1: number[];
	dataReferenceIndex: number;
};
