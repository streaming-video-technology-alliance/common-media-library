import type { Initialization } from './Initialization.ts';
import type { SegmentURL } from './SegmentUrl.ts';

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
