import type { LadderRung } from './LadderRung.ts'

/**
 * Returns the position of the highest rung at or below `bandwidth`.
 * When no rung is at or below `bandwidth`, the position is 0.
 *
 * @param ladder - The rungs in ascending order of bandwidth
 * @param bandwidth - The bandwidth in bits per second
 * @returns The position in `ladder`
 */
export function findRung(ladder: readonly LadderRung[], bandwidth: number): number {
	let index = ladder.length - 1

	while (index > 0 && ladder[index].bandwidth > bandwidth) {
		index--
	}

	return index
}
