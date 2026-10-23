import { doesNotThrow, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { validateFactor } from '../src/validateFactor.ts'

describe('validateFactor', () => {
	it('accepts a finite number above 0 and at most 1', () => {
		for (const factor of [Number.MIN_VALUE, 0.5, 0.9, 1]) {
			doesNotThrow(() => validateFactor('safetyFactor', factor))
		}
	})

	it('throws with the option name and the received value for anything else', () => {
		for (const factor of [0, -0.5, 1.5, NaN, Infinity]) {
			throws(() => validateFactor('upgradeFactor', factor), {
				name: 'RangeError',
				message: `Invalid upgradeFactor: expected a finite number above 0 and at most 1, received ${factor}`,
			})
		}
	})
})
