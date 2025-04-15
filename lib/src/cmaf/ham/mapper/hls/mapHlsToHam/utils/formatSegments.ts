import type { Segment } from '../../../../types/model/Segment.ts';
import type { SegmentHls } from '../../../../types/mapper/hls/SegmentHls.ts';

import { getByterange } from './getByterange.ts';

/**
 * @internal
 *
 * Format the hls segments into the ham segments.
 *
 * @param segments - List of HLS segments
 * @returns ham formatted list of segments
 *
 * @group CMAF
 * @alpha
 */
export function formatSegments(segments: SegmentHls[]): Segment[] {
	return (
		segments?.map((segment: SegmentHls) => {
			const byteRange = getByterange(segment?.byterange);
			return {
				duration: segment.duration,
				url: segment.uri,
				...(byteRange && { byteRange }),
			} as Segment;
		}) ?? []
	);
}
