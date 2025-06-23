import type { Box } from './Box.js';

/**
 * Track Reference Type Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackReferenceTypeBox = Box & {
	type: 'tref';
	trackIds: number[];
};
