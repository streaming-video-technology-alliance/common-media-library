import type { Initialization } from './Initialization.ts';

/**
 * DASH Segment Base
 *
 * @group CMAF
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
