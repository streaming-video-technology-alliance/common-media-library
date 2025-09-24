import type { SubsegmentRange } from './SubsegmentRange.js';

/**
 * Subsegment
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Subsegment = {
	rangesCount: number;
	ranges: SubsegmentRange[];
};
