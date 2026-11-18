import type { FullBox } from './FullBox.ts'

/**
 * Chunk Large Offset Box (`co64`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @public
 */
export type ChunkLargeOffsetBox = FullBox & {
	type: 'co64'
	entryCount: number
	chunkOffset: number[]
}
