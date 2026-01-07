import type { Representation } from '../../../types/mapper/dash/Representation.ts'
import type { SegmentBase } from '../../../types/mapper/dash/SegmentBase.ts'

import type { Segment } from '../../../types/model/Segment.ts'
import { parseByteRangeString } from '../../../utils/byteRange.ts'

/**
 * @internal
 *
 * Maps SegmentBase from dash to Segment list from ham.
 *
 * @param representation - Representation to get the SegmentBase from
 * @param duration - Duration of the segment
 * @returns list of ham segments
 */
export function mapSegmentBase(
	representation: Representation,
	duration: number,
): Segment[] {
	let cumulativeTime = 0
	return representation.SegmentBase?.map((segment: SegmentBase, index: number) => {
		const startTime = cumulativeTime
		cumulativeTime += duration
		const byteRange = parseByteRangeString(segment.$.indexRange)

		const result: Segment = {
			id: `${representation.$.id}-segment-${index}`,
			duration,
			url: representation.BaseURL?.[0] ?? '',
			startTime,
		} as Segment

		// Only include byteRange if it exists
		if (byteRange !== undefined) {
			result.byteRange = byteRange
		}

		return result
	}) ?? []
}
