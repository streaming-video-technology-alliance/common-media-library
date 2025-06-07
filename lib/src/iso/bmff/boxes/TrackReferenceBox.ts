import type { ContainerBox } from './ContainerBox.js';
import type { TrackReferenceTypeBox } from './TrackReferenceTypeBox.js';

/**
 * Track Reference Box - 'tref' - Container
 */
export type TrackReferenceBox = ContainerBox<TrackReferenceTypeBox> & {
	type: 'tref';
};
