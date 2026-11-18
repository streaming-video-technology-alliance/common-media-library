import type { FullBox } from './FullBox.ts'

/**
 * Sync Sample Box (`stss`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.2
 *
 * @public
 */
export type SyncSampleBox = FullBox & {
	type: 'stss'
	entryCount: number
	/** The sample numbers of the sync samples. */
	sampleNumber: number[]
}
