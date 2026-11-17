import type { FullBox } from './FullBox.ts'

/**
 * Sample Group Description Box (`sgpd`).
 *
 * ISO/IEC 14496-12:2015 - 8.9.3
 *
 * @public
 */
export type SampleGroupDescriptionBox = FullBox & {
	type: 'sgpd'
	groupingType: number
	defaultLength?: number
	entryCount: number
	entries: any[]
}
