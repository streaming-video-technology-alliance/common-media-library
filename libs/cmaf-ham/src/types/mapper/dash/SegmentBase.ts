import type { Initialization } from './Initialization.js';

/**
 * DASH Segment Base
 *
 * @alpha
 */
export type SegmentBase = {
	$: {
		indexRange: string;
		indexRangeExact: string;
		timescale: string;
	};
	Initialization: Initialization[];
};
