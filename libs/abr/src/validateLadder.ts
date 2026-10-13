/**
 * Throws a `RangeError` when `ladder` is empty or not in ascending order.
 * Equal adjacent rungs are in ascending order.
 *
 * @param ladder - The bitrates in bits per second
 */
export function validateLadder(ladder: readonly number[]): void {
	const { length } = ladder

	if (length === 0) {
		throw new RangeError('Invalid ladder: expected at least one rung, received an empty array')
	}

	for (let i = 1; i < length; i++) {
		if (ladder[i] < ladder[i - 1]) {
			throw new RangeError(`Invalid ladder: expected ascending order, received ${ladder[i - 1]} at ${i - 1} and ${ladder[i]} at ${i}`)
		}
	}
}
