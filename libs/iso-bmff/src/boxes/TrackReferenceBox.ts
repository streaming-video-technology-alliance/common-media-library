import type { TrackReferenceTypeBox } from './TrackReferenceTypeBox.ts'

/**
 * Child boxes of Track Reference Box
 *
 * @public
 */
export type TrackReferenceBoxChild = TrackReferenceTypeBox;

/**
 * Track Reference Box - 'tref' - Container
 *
 * @public
 */
export type TrackReferenceBox = {
	type: 'tref';
	boxes: TrackReferenceBoxChild[];
};
