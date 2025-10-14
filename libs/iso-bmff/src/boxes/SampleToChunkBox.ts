import type { FullBox } from './FullBox.ts'
import type { SampleToChunkEntry } from './SampleToChunkEntry.ts'

/**
 * Sample to Chunk Box - 'stsc'
 *
 *
 * @beta
 */
export type SampleToChunkBox = FullBox & {
	type: 'stsc';
	entryCount: number;
	entries: SampleToChunkEntry[];
};
