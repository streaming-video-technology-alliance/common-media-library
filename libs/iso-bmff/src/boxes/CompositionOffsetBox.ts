import type { CompositionOffsetEntry } from './CompositionOffsetEntry.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Composition Time To Sample Box (`ctts`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.1.3
 *
 * @public
 */
export type CompositionOffsetBox = FullBox & {
	type: 'ctts'
	/**
	 * The entry count of a box of version 2 or above. These versions have no entries.
	 * For version 0 or 1, the field is `undefined`, and the count is the length of `entries`.
	 */
	entryCount?: number
	entries: CompositionOffsetEntry[]
}
