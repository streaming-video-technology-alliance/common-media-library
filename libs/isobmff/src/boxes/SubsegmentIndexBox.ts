import type { FullBox } from './FullBox.js';
import type { Subsegment } from './Subsegment.js';

/**
 * ISO/IEC 14496-12:2012 - 8.16.4 Subsegment Index Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubsegmentIndexBox = FullBox & {
	type: 'ssix';
	subsegmentCount: number;
	subsegments: Subsegment[];
};
