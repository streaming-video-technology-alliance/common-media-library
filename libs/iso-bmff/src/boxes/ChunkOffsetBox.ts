import type { FullBox } from './FullBox.ts'

/**
 * Chunk Offset Box (`stco`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @public
 */
export type ChunkOffsetBox = FullBox & {
	type: 'stco'
	entryCount: number
	chunkOffset: number[]
}
