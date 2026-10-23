/**
 * @internal
 *
 * Calculates the duration of a segment.
 *
 * segmentDuration = duration / timescale
 *
 * @param duration - Duration of the segment
 * @param timescale - Timescale of the segment
 * @returns Segment duration
 */
export function calculateDuration(
	duration: string | undefined,
	timescale: string | undefined,
): number {
	if (!duration || !timescale) {
		return 1
	}
	return +(duration ?? 1) / +(timescale ?? 1)
}
