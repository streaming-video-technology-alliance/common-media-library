import type { Box } from './Box.js';
import type { ContainerBox } from './ContainerBox.js';
import type { TrackEncryptionBox } from './TrackEncryptionBox.js';

/**
 * Scheme Information Box - 'schi' - Container
 *
 *
 * @beta
 */
export type SchemeInformationBox = ContainerBox<TrackEncryptionBox | Box> & {
	type: 'schi';
};
