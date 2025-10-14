import type { FullBox } from './FullBox.ts';

/**
 * Chunk Large Offset Box - 'co64'
 *
 *
 * @beta
 */
export type ChunkLargeOffsetBox = FullBox & {
	type: 'co64';
	entryCount: number;
	chunkOffset: number[];
};
