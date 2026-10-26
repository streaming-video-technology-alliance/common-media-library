import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { averageTimeToFirstByte } from '../src/averageTimeToFirstByte.ts'

describe('averageTimeToFirstByte', () => {
	it('returns 0 without samples', () => {
		equal(averageTimeToFirstByte([]), 0)
	})

	it('returns the mean of the samples', () => {
		equal(averageTimeToFirstByte([0.25, 0.5, 0.75]), 0.5)
	})
})
