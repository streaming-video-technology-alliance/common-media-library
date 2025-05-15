import type { SegmentList } from '../../../types/mapper/dash/SegmentList.js';
import type { SegmentURL } from '../../../types/mapper/dash/SegmentUrl.js';

import type { Segment } from '../../../types/model/Segment.js';

import { calculateDuration } from './utils/calculateDuration.js';

/**
 * @internal
 *
 * Maps SegmentList from dash to Segment list from ham.
 *
 * @param segmentList - SegmentList list from dash
 * @returns list of ham segments
 */
export function mapSegmentList(segmentList: SegmentList[]): Segment[] {
	const segments: Segment[] = [];
	segmentList.map((segment: SegmentList) => {
		if (segment.SegmentURL) {
			return segment.SegmentURL.forEach((segmentURL: SegmentURL) => {
				segments.push({
					duration: calculateDuration(
						segment.$.duration,
						segment.$.timescale,
					),
					url: segmentURL.$.media ?? '',
				} as Segment);
			});
		}
	});
	return segments;
}
