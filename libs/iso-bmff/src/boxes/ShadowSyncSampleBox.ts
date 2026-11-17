import type { FullBox } from './FullBox.ts'
import type { ShadowSyncEntry } from './ShadowSyncEntry.ts'

/**
 * Shadow Sync Sample Box (`stsh`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.3
 *
 * @public
 */
export type ShadowSyncSampleBox = FullBox & {
	type: 'stsh'
	entryCount: number
	entries: ShadowSyncEntry[]
}
