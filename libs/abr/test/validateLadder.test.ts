import { doesNotThrow, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { validateLadder } from '../src/validateLadder.ts'

describe('validateLadder', () => {
	it('accepts a ladder in ascending order', () => {
		doesNotThrow(() => validateLadder([300_000, 750_000, 1_500_000]))
		doesNotThrow(() => validateLadder([300_000]))
	})

	it('accepts equal adjacent rungs', () => {
		doesNotThrow(() => validateLadder([300_000, 750_000, 750_000]))
	})

	it('throws when the ladder is empty', () => {
		throws(() => validateLadder([]), {
			name: 'RangeError',
			message: 'Invalid ladder: expected at least one rung, received an empty array',
		})
	})

	it('throws with both positions and values when the ladder is not in ascending order', () => {
		throws(() => validateLadder([300_000, 1_500_000, 750_000, 3_000_000]), {
			name: 'RangeError',
			message: 'Invalid ladder: expected ascending order, received 1500000 at 1 and 750000 at 2',
		})
	})
})
