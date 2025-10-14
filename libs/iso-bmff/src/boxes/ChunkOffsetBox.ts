import type { FullBox } from './FullBox.ts';

/**
 * Chunk Offset Box - 'stco'
 *
 *
 * @beta
 */
export type ChunkOffsetBox = FullBox & {
	type: 'stco';
	entryCount: number;
	chunkOffset: number[];
};
