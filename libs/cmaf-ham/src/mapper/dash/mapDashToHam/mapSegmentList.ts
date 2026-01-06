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
	let segmentIndex = 0
	let cumulativeTime = 0

	segmentList.map((segment: SegmentList) => {
		if (segment.SegmentURL) {
			return segment.SegmentURL.forEach((segmentURL: SegmentURL) => {
				const duration = calculateDuration(
					segment.$.duration,
					segment.$.timescale,
				)
				const startTime = cumulativeTime
				cumulativeTime += duration

				segments.push({
					id: `segment-${segmentIndex++}`,
					duration,
					url: segmentURL.$.media ?? '',
					// byteRange not included - SegmentList typically doesn't include byteRange info
					startTime,
				} as Segment)
			})
		}
	})
	return segments
}
