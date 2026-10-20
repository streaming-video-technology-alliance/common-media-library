/**
 * Applies the oscillation guard of BOLA-O to a pick.
 *
 * Suppose the pick is above both the current rung and the rung that the throughput sustains.
 * Then the guard keeps the higher of those two rungs. Other picks pass unchanged.
 * The guard never forces a downward switch.
 *
 * @param pick - The position that the buffer picked
 * @param current - The position of the current rung
 * @param sustained - The position of the highest rung that the throughput sustains
 * @returns The position after the guard
 */
export function limitUpwardSwitch(pick: number, current: number, sustained: number): number {
	if (pick > current && pick > sustained) {
		return Math.max(current, sustained)
	}

	return pick
}
