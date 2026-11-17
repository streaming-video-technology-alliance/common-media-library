/**
 * Media Data Box (`mdat`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.1
 *
 * @public
 */
export type MediaDataBox = {
	type: 'mdat'
	/** The media data. The bytes are a view over the input buffer. */
	data: Uint8Array
}
