import { doesNotThrow, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { validateLadder } from '../src/validateLadder.ts'

function rungs(...bandwidths: number[]): { bandwidth: number }[] {
	return bandwidths.map(bandwidth => ({ bandwidth }))
}

describe('validateLadder', () => {
	it('accepts a ladder in ascending order of bandwidth', () => {
		doesNotThrow(() => validateLadder(rungs(300_000, 750_000, 1_500_000)))
		doesNotThrow(() => validateLadder(rungs(300_000)))
	})

	it('accepts equal neighbouring bandwidths', () => {
		doesNotThrow(() => validateLadder(rungs(300_000, 750_000, 750_000)))
	})

	it('throws when the ladder is empty', () => {
		throws(() => validateLadder([]), {
			name: 'RangeError',
			message: 'Invalid ladder: expected at least one rung, received an empty array',
		})
	})

	it('throws with the position and the value when a bandwidth is not a positive finite number', () => {
		for (const bandwidth of [NaN, 0, -1, Infinity]) {
			throws(() => validateLadder(rungs(300_000, 750_000, bandwidth)), {
				name: 'RangeError',
				message: `Invalid ladder: expected a positive finite bandwidth at 2, received ${bandwidth}`,
			})
		}
	})

	it('throws with both positions and values when the ladder is not in ascending order', () => {
		throws(() => validateLadder(rungs(300_000, 1_500_000, 750_000, 3_000_000)), {
			name: 'RangeError',
			message: 'Invalid ladder: expected ascending bandwidth, received 1500000 at 1 and 750000 at 2',
		})
	})
})
