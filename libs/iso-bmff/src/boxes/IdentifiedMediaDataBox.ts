/**
 * Identified Media Data Box (`imda`).
 *
 * ISO/IEC 14496-12
 *
 * @public
 */
export type IdentifiedMediaDataBox = {
	type: 'imda'
	imdaIdentifier: number
	/** The media data. The bytes are a view over the input buffer. */
	data: Uint8Array
}
