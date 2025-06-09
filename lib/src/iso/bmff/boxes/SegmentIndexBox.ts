import type { FullBox } from './FullBox.js';
import type { SegmentIndexReference } from './SegmentIndexReference.js';

/**
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SegmentIndexBox = FullBox & {
	type: 'sidx';
	referenceId: number;
	timescale: number;
	earliestPresentationTime: number;
	firstOffset: number;
	reserved: number;
	references: SegmentIndexReference[];
};
