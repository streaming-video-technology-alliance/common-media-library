import type { CompositionTimeToSampleEntry } from './CompositionTimeToSampleEntry.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
 *
 * @public
 */
export type CompositionTimeToSampleBox = FullBox & {
	type: 'ctts';
	entryCount: number;
	entries: CompositionTimeToSampleEntry[];
};

/**
 * @public
 */
export type ctts = CompositionTimeToSampleBox;
