import type { FullBox } from './FullBox.js';

/**
 * Chunk Offset Box - 'stco'
 */
export type ChunkOffsetBox = FullBox & {
	type: 'stco';
	entryCount: number;
	chunkOffset: number[];
};
