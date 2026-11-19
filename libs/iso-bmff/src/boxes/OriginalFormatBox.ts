/**
 * Original Format Box (`frma`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.2
 *
 * @public
 */
export type OriginalFormatBox = {
	type: 'frma'
	/** The four-character code of the original sample entry, such as `avc1`. */
	dataFormat: string
}
