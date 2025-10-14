import type { SegmentHls } from '../../../../types/mapper/hls/SegmentHls.ts'
import type { Segment } from '../../../../types/model/Segment.ts'

import { decodeByteRange } from './decodeByteRange.ts'

/**
 * @internal
 *
 * Format the hls segments into the ham segments.
 *
 * @param segments - List of HLS segments
 * @returns ham formatted list of segments
 *
 * @alpha
 */
export function formatSegments(segments: SegmentHls[]): Segment[] {
	return (
		segments?.map((segment: SegmentHls) => {
			const byteRange = decodeByteRange(segment?.byterange)
			return {
				duration: segment.duration,
				url: segment.uri,
				...(byteRange && { byteRange }),
			} as Segment
		}) ?? []
	)
}
