import type { FullBox } from './FullBox.ts'
import type { SubsampleEntry } from './SubsampleEntry.ts'

/**
 * Subsample Information Box (`subs`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.7
 *
 * @public
 */
export type SubsampleInformationBox = FullBox & {
	type: 'subs'
	entryCount: number
	entries: SubsampleEntry[]
}
