import { deepEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'
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

// The waits of `count` timings of 100, 200, ... milliseconds.
function recordWaits(waits: number[], count: number): void {
	for (let i = 1; i <= count; i++) {
		recordFirstByteWait(waits, timing(i * 100))
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
		recordFirstByteWait(waits, {
			startTime: 1000,
			responseStart: 1101,
			duration: 100,
			encodedBodySize: 1,
		})
		recordFirstByteWait(waits, {
			startTime: 1000,
			responseStart: 1050,
			duration: NaN,
			encodedBodySize: 1,
		})

		deepEqual(waits, [])
	})

	it('keeps the last four waits', () => {
		const waits: number[] = []

		recordWaits(waits, FIRST_BYTE_WAIT_SAMPLE_COUNT + 2)

		deepEqual(waits, [0.3, 0.4, 0.5, 0.6])
	})

	it('keeps a full window when a timing without a usable responseStart arrives', () => {
		const waits: number[] = []

		recordWaits(waits, FIRST_BYTE_WAIT_SAMPLE_COUNT)
		recordFirstByteWait(waits, { startTime: 1000, duration: 100, encodedBodySize: 1 })

		deepEqual(waits, [0.1, 0.2, 0.3, 0.4])
	})
})
