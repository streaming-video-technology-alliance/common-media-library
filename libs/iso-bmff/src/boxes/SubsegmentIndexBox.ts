import type { FullBox } from './FullBox.ts'
import type { Subsegment } from './Subsegment.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 *
 *
 * @beta
 */
export type SubsegmentIndexBox = FullBox<'ssix'> & {
	subsegmentCount: number;
	subsegments: Subsegment[];
};
