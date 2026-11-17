import type { TrackEncryptionBox } from './TrackEncryptionBox.ts'

/**
 * Child boxes of Scheme Information Box
 *
 * @public
 */
export type SchemeInformationBoxChild = TrackEncryptionBox

/**
 * Scheme Information Box (`schi`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.6
 *
 * @public
 */
export type SchemeInformationBox = {
	type: 'schi'
	boxes: SchemeInformationBoxChild[]
}
