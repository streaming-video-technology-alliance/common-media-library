import type { FullBox } from './FullBox.js';

/**
 * Chunk Offset Box - 'stco'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ChunkOffsetBox = FullBox & {
	type: 'stco';
	entryCount: number;
	chunkOffset: number[];
};
