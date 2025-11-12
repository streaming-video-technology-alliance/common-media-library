import type { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.5.2.2 Sample Entry
 *
 *
 * @beta
 */
export type SampleEntryBox = Box<BoxType> & {
	reserved1: number[];
	dataReferenceIndex: number;
};
