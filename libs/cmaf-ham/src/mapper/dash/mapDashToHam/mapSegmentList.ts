import type { SegmentList } from '../../../types/mapper/dash/SegmentList.ts'
import type { SegmentURL } from '../../../types/mapper/dash/SegmentUrl.ts'

import type { Segment } from '../../../types/model/Segment.ts'

import { calculateDuration } from './utils/calculateDuration.ts'

/**
 * @internal
 *
 * Maps SegmentList from dash to Segment list from ham.
 *
 * @param segmentList - SegmentList list from dash
 * @returns list of ham segments
 */
export function mapSegmentList(segmentList: SegmentList[]): Segment[] {
	const segments: Segment[] = []
	segmentList.map((segment: SegmentList) => {
		if (segment.SegmentURL) {
			return segment.SegmentURL.forEach((segmentURL: SegmentURL) => {
				segments.push({
					duration: calculateDuration(
						segment.$.duration,
						segment.$.timescale,
					),
					url: segmentURL.$.media ?? '',
				} as Segment)
			})
		}
	})
	return segments
}
