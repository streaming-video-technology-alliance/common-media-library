import type { FullBox } from './FullBox.js';
import type { SampleToChunkEntry } from './SampleToChunkEntry.js';

/**
 * Sample to Chunk Box - 'stsc'
 */
export type SampleToChunkBox = FullBox & {
	type: 'stsc';
	entryCount: number;
	entries: SampleToChunkEntry[];
};
