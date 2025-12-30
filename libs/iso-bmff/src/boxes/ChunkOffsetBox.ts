import type { FullBox } from './FullBox.ts'

/**
 * Chunk Offset Box - 'stco'
 *
 *
 * @public
 */
export type ChunkOffsetBox = FullBox & {
	type: 'stco';
	entryCount: number;
	chunkOffset: number[];
};
