import { downloadTime } from './downloadTime.ts'
import { findRung } from './findRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import type { LadderRung } from './LadderRung.ts'

/**
 * Returns the position of the highest rung whose download fits in one segment.
 *
 * The download time of a rung comes from `downloadTime` with `safeThroughput` and `timeToFirstByte`.
 * A rung fits when that time is at most `segmentDuration / playbackRate`.
 * Without a positive finite `segmentDuration`, the function returns `findRung(ladder, safeThroughput / playbackRate)`.
 * When no rung fits, the position is 0.
 *
 * @param ladder - The rungs in ascending order of bandwidth
 * @param safeThroughput - The bits per second that the download may use
 * @param playbackRate - The playback rate. 1 is normal speed.
 * @param segmentDuration - The media duration of the next segment, in seconds, or `undefined`
 * @param timeToFirstByte - The time to first byte of the download, in seconds
 * @returns The position in `ladder`
 */
export function findSustainableRung(
	ladder: readonly LadderRung[],
	safeThroughput: number,
	playbackRate: number,
	segmentDuration: number | undefined,
	timeToFirstByte: number,
): number {
	if (!isPositiveFinite(segmentDuration)) {
		return findRung(ladder, safeThroughput / playbackRate)
	}

	const budget = segmentDuration / playbackRate

	for (let i = ladder.length - 1; i >= 0; i--) {
		if (downloadTime(ladder[i], segmentDuration, safeThroughput, timeToFirstByte) <= budget) {
			return i
		}
	}

	return 0
}
