import type { LadderRung } from './LadderRung.ts'

/**
 * Applies the starvation guard to a pick.
 *
 * The download time of a rung is `firstByteWait` plus the transfer of one segment at `safeThroughput`.
 * The first pass keeps the highest rung, at or below the pick, whose download time is within `budget`.
 * If no rung passes, the second pass keeps the highest rung within `budget + tolerance`, or rung 0.
 * A tolerance of 0 makes the second pass fail too. The guard then has one pass, and rung 0 is the fallback.
 * The guard never raises a pick.
 *
 * @param ladder - The rungs in ascending order of bandwidth
 * @param index - The position of the pick in `ladder`
 * @param segmentDuration - The media duration of the next segment, in seconds
 * @param safeThroughput - The bits per second that the download may use
 * @param firstByteWait - The seconds that the download waits for its first byte
 * @param budget - The seconds that the real buffer lasts
 * @param tolerance - The seconds that the second pass adds to `budget`. The value is 0 or more.
 * @returns The position after the guard
 */
export function applyStarvationGuard(
	ladder: readonly LadderRung[],
	index: number,
	segmentDuration: number,
	safeThroughput: number,
	firstByteWait: number,
	budget: number,
	tolerance: number,
): number {
	for (let i = index; i >= 0; i--) {
		if (downloadTime(ladder[i], segmentDuration, safeThroughput, firstByteWait) <= budget) {
			return i
		}
	}

	for (let i = index; i > 0; i--) {
		if (
			downloadTime(ladder[i], segmentDuration, safeThroughput, firstByteWait) <=
			budget + tolerance
		) {
			return i
		}
	}

	return 0
}

function downloadTime(
	rung: LadderRung,
	segmentDuration: number,
	safeThroughput: number,
	firstByteWait: number,
): number {
	return firstByteWait + (rung.bandwidth * segmentDuration) / safeThroughput
}
