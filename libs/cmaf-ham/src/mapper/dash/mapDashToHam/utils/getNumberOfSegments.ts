import type { SegmentTemplate } from '../../../../types/mapper/dash/SegmentTemplate.ts';
import { calculateDuration } from './calculateDuration.ts';
/**
 * @internal
 *
 * Calculates the number of segments that a track has to use SegmentTemplate.
 *
 * Equation used:
 * segments = total duration / (segment duration / timescale)
 *
 * **This equation might be wrong, please double-check it**
 *
 * @param segmentTemplate - SegmentTemplate object
 * @param duration - Total duration of the content
 * @returns Number of segments
 */
export function getNumberOfSegments(
	segmentTemplate: SegmentTemplate,
	duration: number,
): number {
	// FIXME: This equation may be wrong
	return Math.round(
		duration /
		calculateDuration(
			segmentTemplate.$.duration,
			segmentTemplate.$.timescale,
		),
	);
}
