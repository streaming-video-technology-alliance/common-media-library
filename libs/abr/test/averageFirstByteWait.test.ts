import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { averageFirstByteWait } from '../src/averageFirstByteWait.ts'

describe('averageFirstByteWait', () => {
	it('returns 0 without waits', () => {
		equal(averageFirstByteWait([]), 0)
	})

	it('returns the mean of the waits', () => {
		equal(averageFirstByteWait([0.25, 0.5, 0.75]), 0.5)
	})
})
