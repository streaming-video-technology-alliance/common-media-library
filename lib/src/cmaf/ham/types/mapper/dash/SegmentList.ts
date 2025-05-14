import type { Initialization } from './Initialization';
import type { SegmentURL } from './SegmentUrl';

/**
 * DASH Segment List
 *
 * @group CMAF
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
