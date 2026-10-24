import type { LadderRung } from './LadderRung.ts'

/**
 * Returns the seconds that one segment of `rung` takes to download.
 * The time is the time to first byte plus the transfer of `segmentDuration` seconds of media at `safeThroughput`.
 *
 * @param rung - The rung
 * @param segmentDuration - The media duration of the segment, in seconds
 * @param safeThroughput - The bits per second that the download may use
 * @param timeToFirstByte - The time to first byte of the download, in seconds
 * @returns The download time in seconds
 */
export function downloadTime(
	rung: LadderRung,
	segmentDuration: number,
	safeThroughput: number,
	timeToFirstByte: number,
): number {
	return timeToFirstByte + (rung.bandwidth * segmentDuration) / safeThroughput
}
