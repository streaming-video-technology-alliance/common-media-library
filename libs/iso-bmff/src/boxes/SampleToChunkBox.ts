import type { FullBox } from './FullBox.ts'
import type { SampleToChunkEntry } from './SampleToChunkEntry.ts'

/**
 * Sample To Chunk Box (`stsc`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.4
 *
 * @public
 */
export type SampleToChunkBox = FullBox & {
	type: 'stsc'
	entryCount: number
	entries: SampleToChunkEntry[]
}
