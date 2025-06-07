import type { FullBox } from './FullBox.js';

/**
 * Chunk Large Offset Box - 'co64'
 */
export type ChunkLargeOffsetBox = FullBox & {
	type: 'co64';
	entryCount: number;
	chunkOffset: number[];
};
