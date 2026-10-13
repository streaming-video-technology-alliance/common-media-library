/**
 * Returns the position of the highest rung at or below `bitrate`.
 * When no rung is at or below `bitrate`, the position is 0.
 *
 * @param ladder - The bitrates in ascending order, in bits per second
 * @param bitrate - The bitrate in bits per second
 * @returns The position in `ladder`
 */
export function findRung(ladder: readonly number[], bitrate: number): number {
	let index = ladder.length - 1

	while (index > 0 && ladder[index] > bitrate) {
		index--
	}

	return index
}
