import type { FullBox } from './FullBox.ts'
import type { SubSampleInformationEntry } from './SubSampleInformationEntry.ts'

/**
 * Subsample Information Box (`subs`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.7
 *
 * @public
 */
export type SubSampleInformationBox = FullBox & {
	type: 'subs'
	entries: SubSampleInformationEntry[]
}
