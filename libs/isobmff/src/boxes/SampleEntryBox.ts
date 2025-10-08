import type { Box } from './Box.js';

/**
 * ISO/IEC 14496-12:2015 - 8.5.2.2 Sample Entry
 *
 *
 * @beta
 */
export type SampleEntryBox = Box & {
	reserved1: number[];
	dataReferenceIndex: number;
};
