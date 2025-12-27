import type { Box } from './Box.ts'

/**
 * Track Reference Type Box
 *
 * @public
 */
export type TrackReferenceTypeBox = Box & {
	type: 'tref';
	trackIds: number[];
};
