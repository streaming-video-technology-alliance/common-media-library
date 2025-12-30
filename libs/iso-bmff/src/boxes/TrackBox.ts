import type { EditBox } from './EditBox.ts'
import type { MediaBox } from './MediaBox.ts'
import type { TrackHeaderBox } from './TrackHeaderBox.ts'
import type { TrackReferenceBox } from './TrackReferenceBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Child boxes of Track Box
 *
 * @public
 */
export type TrackBoxChild = TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox;

/**
 * Track Box - 'trak' - Container
 *
 * @public
 */
export type TrackBox = {
	type: 'trak';
	boxes: TrackBoxChild[];
};

/**
 * @public
 */
export type trak = TrackBox;
