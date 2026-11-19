import type { FullBox } from './FullBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Chunk Large Offset Box (`co64`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @public
 */
export type ChunkLargeOffsetBox<V extends IsoInt64 = number> = FullBox & {
	type: 'co64'

	/** The 64-bit offset of each chunk, from the start of the file. */
	chunkOffset: V[]
}
