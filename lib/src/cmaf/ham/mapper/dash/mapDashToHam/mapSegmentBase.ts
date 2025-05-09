import type { Representation } from '../../../types/mapper/dash/Representation.ts';
import type { SegmentBase } from '../../../types/mapper/dash/SegmentBase.ts';

import type { Segment } from '../../../types/model/Segment.ts';

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
	return representation.SegmentBase!.map((segment: SegmentBase) => {
		return {
			duration,
			url: representation.BaseURL![0] ?? '',
			byteRange: segment.$.indexRange,
		} as Segment;
	});
}
