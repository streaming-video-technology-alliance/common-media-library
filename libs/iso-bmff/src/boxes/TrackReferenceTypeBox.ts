import type { Box } from './Box.js';

/**
 * Track Reference Type Box
 *
 *
 * @beta
 */
export type TrackReferenceTypeBox = Box & {
	type: 'tref';
	trackIds: number[];
};
