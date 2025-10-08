import type { Initialization } from './Initialization.js';
import type { SegmentURL } from './SegmentUrl.js';

/**
 * DASH Segment List
 *
 * @alpha
 */
export type SegmentList = {
	$: {
		duration: string;
		timescale: string;
	};
	Initialization: Initialization[];
	SegmentURL?: SegmentURL[];
};
