import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { averageFirstByteWait } from '../src/averageFirstByteWait.ts'
import { FIRST_BYTE_WAIT_SAMPLE_COUNT } from '../src/FIRST_BYTE_WAIT_SAMPLE_COUNT.ts'
import { recordFirstByteWait } from '../src/recordFirstByteWait.ts'

// A timing that waited `waitMs` for its first byte and then transferred for 100 ms.
function timing(waitMs: number) {
	return {
		startTime: 1000,
		responseStart: 1000 + waitMs,
		duration: waitMs + 100,
		encodedBodySize: 1,
	}
}

describe('recordFirstByteWait', () => {
	it('adds the wait in seconds', () => {
		const waits: number[] = []

		recordFirstByteWait(waits, timing(250))

		deepEqual(waits, [0.25])
	})

	it('adds nothing for a timing without a usable responseStart', () => {
		const waits: number[] = []

		recordFirstByteWait(waits, { startTime: 1000, duration: 100, encodedBodySize: 1 })
		recordFirstByteWait(waits, {
			startTime: 1000,
			responseStart: 900,
			duration: 100,
			encodedBodySize: 1,
		})

		deepEqual(waits, [])
	})

	it('keeps the last four waits', () => {
		const waits: number[] = []

		for (let i = 1; i <= FIRST_BYTE_WAIT_SAMPLE_COUNT + 2; i++) {
			recordFirstByteWait(waits, timing(i * 100))
		}

		deepEqual(waits, [0.3, 0.4, 0.5, 0.6])
	})
})

describe('averageFirstByteWait', () => {
	it('returns 0 without waits', () => {
		equal(averageFirstByteWait([]), 0)
	})

	it('returns the mean of the waits', () => {
		equal(averageFirstByteWait([0.25, 0.5, 0.75]), 0.5)
	})
})
