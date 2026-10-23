import { doesNotThrow, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { validateBufferTarget } from '../src/validateBufferTarget.ts'

describe('validateBufferTarget', () => {
	it('accepts a positive finite number', () => {
		for (const bufferTarget of [0.5, 1, 18, 600]) {
			doesNotThrow(() => validateBufferTarget(bufferTarget))
		}
	})

	it('throws with the expected value and the received value for anything else', () => {
		for (const bufferTarget of [0, -3, NaN, Infinity, -Infinity]) {
			throws(() => validateBufferTarget(bufferTarget), {
				name: 'RangeError',
				message: `Invalid bufferTarget: expected a positive finite number of seconds, received ${bufferTarget}`,
			})
		}
	})
})
