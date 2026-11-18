import type { FullBox } from './FullBox.ts'

/**
 * Data Entry URN Box (`urn `).
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @public
 */
export type DataEntryUrnBox = FullBox & {
	type: 'urn '
	name: string
	location: string
}
