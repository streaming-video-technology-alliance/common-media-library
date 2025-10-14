import type { ContainerBox } from './ContainerBox.ts';
import type { TrackReferenceTypeBox } from './TrackReferenceTypeBox.ts';

/**
 * Track Reference Box - 'tref' - Container
 *
 *
 * @beta
 */
export type TrackReferenceBox = ContainerBox<TrackReferenceTypeBox> & {
	type: 'tref';
};
