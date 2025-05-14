import type { Initialization } from './Initialization';

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
