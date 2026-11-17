import type { FullBox } from './FullBox.ts'
import type { SampleToGroupEntry } from './SampleToGroupEntry.ts'

/**
 * Sample To Group Box (`sbgp`).
 *
 * ISO/IEC 14496-12:2015 - 8.9.2
 *
 * @public
 */
export type SampleToGroupBox = FullBox & {
	type: 'sbgp'
	groupingType: number
	groupingTypeParameter?: number
	entryCount: number
	entries: SampleToGroupEntry[]
}
