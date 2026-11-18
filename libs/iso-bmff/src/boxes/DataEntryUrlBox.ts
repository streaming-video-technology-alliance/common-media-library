import type { FullBox } from './FullBox.ts'

/**
 * Data Entry URL Box (`url `).
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @public
 */
export type DataEntryUrlBox = FullBox & {
	type: 'url '
	location: string
}
