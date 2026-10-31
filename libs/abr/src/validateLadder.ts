import type { LadderRung } from './LadderRung.ts'

/**
 * Throws a `RangeError` when `ladder` is empty, when a bandwidth is not a positive finite number,
 * or when the bandwidths are not in ascending order. Equal neighbouring bandwidths are in ascending order.
 *
 * @param ladder - The rungs
 */
export function validateLadder(ladder: readonly LadderRung[]): void {
	const { length } = ladder

	if (length === 0) {
		throw new RangeError('Invalid ladder: expected at least one rung, received an empty array')
	}

	for (let i = 0; i < length; i++) {
		const { bandwidth } = ladder[i]

		if (!Number.isFinite(bandwidth) || bandwidth <= 0) {
			throw new RangeError(
				`Invalid ladder: expected a positive finite bandwidth at ${i}, received ${bandwidth}`,
			)
		}

		if (i > 0 && bandwidth < ladder[i - 1].bandwidth) {
			throw new RangeError(
				`Invalid ladder: expected ascending bandwidth, received ${ladder[i - 1].bandwidth} at ${i - 1} and ${bandwidth} at ${i}`,
			)
		}
	}
}
