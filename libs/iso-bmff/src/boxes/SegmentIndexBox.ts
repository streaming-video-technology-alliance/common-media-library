import type { FullBox } from './FullBox.ts'
import type { SegmentIndexReference } from './SegmentIndexReference.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 *
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
