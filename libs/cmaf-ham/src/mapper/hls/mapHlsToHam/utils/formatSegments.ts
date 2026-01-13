import type { SegmentHls } from '../../../../types/mapper/hls/SegmentHls.ts'
import type { Segment } from '../../../../types/model/Segment.ts'

import { hlsByterangeToByteRangeObject } from '../../../../utils/byteRange.ts'

/**
 * Format the hls segments into the ham segments.
 *
 * @param segments - List of HLS segments
 * @returns ham formatted list of segments
 *
 * @alpha
 */
export function formatSegments(segments: SegmentHls[]): Segment[] {
	let cumulativeTime = 0
	return (
		segments?.map((segment: SegmentHls, index: number) => {
			const byteRange = hlsByterangeToByteRangeObject(segment?.byterange)
			const startTime = cumulativeTime
			cumulativeTime += segment.duration

			const result: Segment = {
				id: `segment-${index}`,
				duration: segment.duration,
				url: segment.uri,
				startTime,
			} as Segment

			// Only include byteRange if it exists
			if (byteRange !== undefined) {
				result.byteRange = byteRange
			}

			return result
		}) ?? []
	)
}
