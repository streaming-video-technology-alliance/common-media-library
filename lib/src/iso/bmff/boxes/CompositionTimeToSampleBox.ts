import type { CompTimeToSampleEntry } from './CompTimeToSampleEntry.js';
import type { FullBox } from './FullBox.js';

/**
 * Composition Time to Sample Box - 'ctts'
 */
export type CompositionTimeToSampleBox = FullBox & {
	type: 'ctts';
	entryCount: number;
	entries: CompTimeToSampleEntry[];
};
