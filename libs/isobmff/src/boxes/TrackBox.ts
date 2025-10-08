import type { ContainerBox } from './ContainerBox.js';
import type { EditBox } from './EditBox.js';
import type { MediaBox } from './MediaBox.js';
import type { TrackHeaderBox } from './TrackHeaderBox.js';
import type { TrackReferenceBox } from './TrackReferenceBox.js';
import type { UserDataBox } from './UserDataBox.js';

/**
 * Track Box - 'trak' - Container
 *
 *
 * @beta
 */
export type TrackBox = ContainerBox<TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox> & {
	type: 'trak';
};
