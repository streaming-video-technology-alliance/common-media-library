import type { FullBox } from './FullBox.js';

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
