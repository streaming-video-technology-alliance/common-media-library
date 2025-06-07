import type { FullBox } from './FullBox.js';
import type { TimeToSampleEntry } from './TimeToSampleEntry.js';

/**
 * Decoding Time to Sample Box - 'stts'
 */
export type DecodingTimeToSampleBox = FullBox & {
	type: 'stts';
	entryCount: number;
	entries: TimeToSampleEntry[];
};
