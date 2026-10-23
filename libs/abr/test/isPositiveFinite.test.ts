import { equal } from 'node:assert'
import { describe, it } from 'vitest'
import { isPositiveFinite } from '../src/isPositiveFinite.ts'

describe('isPositiveFinite', () => {
	it('returns true for a finite number above 0', () => {
		for (const value of [Number.MIN_VALUE, 0.5, 1, 1e9]) {
			equal(isPositiveFinite(value), true, `${value}`)
		}
	})

	it('returns false for 0, a negative number, NaN, Infinity, and undefined', () => {
		for (const value of [0, -0, -1, NaN, Infinity, -Infinity, undefined]) {
			equal(isPositiveFinite(value), false, `${value}`)
		}
	})
})
