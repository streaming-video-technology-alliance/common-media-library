import type { FullBox } from './FullBox.ts'
import type { SampleToChunkEntry } from './SampleToChunkEntry.ts'

/**
 * Sample to Chunk Box - 'stsc'
 *
 *
 * @beta
 */
export type SampleToChunkBox = FullBox<'stsc'> & {
	entryCount: number;
	entries: SampleToChunkEntry[];
};
