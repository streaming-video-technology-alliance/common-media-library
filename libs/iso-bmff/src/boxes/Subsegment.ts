import type { SubsegmentRange } from './SubsegmentRange.ts'

/**
 * Subsegment
 *
 * @public
 */
export type Subsegment = {
	rangesCount: number;
	ranges: SubsegmentRange[];
};
