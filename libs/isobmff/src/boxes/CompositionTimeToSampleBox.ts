import type { CompositionTimeToSampleEntry } from './CompositionTimeToSampleEntry.js';
import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.6.1.3 Composition Time To Sample Box
 *
 *
 * @beta
 */
export type CompositionTimeToSampleBox = FullBox & {
	type: 'ctts';
	entryCount: number;
	entries: CompositionTimeToSampleEntry[];
};
