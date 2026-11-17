import type { CompositionTimeToSampleEntry } from './CompositionTimeToSampleEntry.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Composition Time To Sample Box (`ctts`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * @public
 */
export type CompositionTimeToSampleBox = FullBox & {
	type: 'ctts'
	entryCount: number
	entries: CompositionTimeToSampleEntry[]
}
