import type { LadderRung } from './LadderRung.ts'

/**
 * Returns `true` when `ladder` has the same bandwidths as `bandwidths`, in the same order.
 * The comparison allocates nothing, and it detects a change made in place.
 *
 * @param ladder - The rungs of the current call
 * @param bandwidths - The bandwidths that a selector stored from an earlier call
 * @returns Whether the two have equal bandwidths
 */
export function isSameLadder(ladder: readonly LadderRung[], bandwidths: readonly number[]): boolean {
	if (ladder.length !== bandwidths.length) {
		return false
	}

	for (let i = 0; i < ladder.length; i++) {
		if (ladder[i].bandwidth !== bandwidths[i]) {
			return false
		}
	}

	return true
}
