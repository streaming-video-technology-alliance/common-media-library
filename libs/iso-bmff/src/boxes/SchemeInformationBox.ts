import type { TrackEncryptionBox } from './TrackEncryptionBox.ts'

/**
 * Child boxes of Scheme Information Box
 *
 * @public
 */
export type SchemeInformationBoxChild = TrackEncryptionBox;

/**
 * Scheme Information Box - 'schi' - Container
 *
 * @public
 */
export type SchemeInformationBox = {
	type: 'schi';
	boxes: SchemeInformationBoxChild[];
};
