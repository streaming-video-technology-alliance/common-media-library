import type { FullBox } from './FullBox.ts'

/**
 * Compact Sample Size Box (`stz2`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @public
 */
export type CompactSampleSizeBox = FullBox & {
	type: 'stz2'

	/**
	 * The size in bits of each entry of `entrySize`. The specification allows 4, 8, and 16.
	 * For another value, the reader returns no entries, and the writer writes no entries.
	 */
	fieldSize: number

	/** The size of each sample. */
	entrySize: number[]
}
