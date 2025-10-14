import type { Initialization } from './Initialization.ts'

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
