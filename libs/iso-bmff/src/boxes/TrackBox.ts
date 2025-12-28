import type { ContainerBox } from './ContainerBox.ts'
import type { EditBox } from './EditBox.ts'
import type { MediaBox } from './MediaBox.ts'
import type { TrackHeaderBox } from './TrackHeaderBox.ts'
import type { TrackReferenceBox } from './TrackReferenceBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Track Box - 'trak' - Container
 *
 * @public
 */
export type TrackBox = ContainerBox<TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox> & {
	type: 'trak';
};

/**
 * @public
 */
export type trak = TrackBox;
