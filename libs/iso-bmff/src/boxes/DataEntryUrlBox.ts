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
	/**
	 * The URL of the data. A box with the flag `0x000001` has the data in the same file and no location.
	 * The field is `undefined` when the box has no bytes after the flags. The writer writes no location for the flag.
	 */
	location?: string
}
