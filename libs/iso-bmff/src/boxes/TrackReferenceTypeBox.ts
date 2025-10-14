import type { Box } from './Box.ts';

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
