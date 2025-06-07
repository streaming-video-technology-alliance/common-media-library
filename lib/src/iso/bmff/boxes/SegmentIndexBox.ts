import type { FullBox } from './FullBox.js';
import type { SegmentReference } from './SegmentReference.js';

/**
 * Segment Index Box - 'sidx'
 */
export type SegmentIndexBox = FullBox & {
	type: 'sidx';
	referenceId: number;
	timescale: number;
	earliestPresentationTime: number;
	firstOffset: number;
	referenceCount: number;
	references: SegmentReference[];
};
