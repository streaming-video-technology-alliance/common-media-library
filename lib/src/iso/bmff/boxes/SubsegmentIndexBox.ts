import type { FullBox } from './FullBox.js';

/**
 * Subsegment range
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Range = {
	level: number;
	rangeSize: number;
};

/**
 * Subsegment
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Subsegment = {
	rangesCount: number;
	ranges: Range[];
};

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
