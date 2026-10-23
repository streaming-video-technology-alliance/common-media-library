import { deepEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { TIME_TO_FIRST_BYTE_SAMPLE_COUNT } from '../src/TIME_TO_FIRST_BYTE_SAMPLE_COUNT.ts'
import { recordTimeToFirstByte } from '../src/recordTimeToFirstByte.ts'

// A timing with a time to first byte of `timeToFirstByteMs` and a 100 ms transfer.
function timing(timeToFirstByteMs: number) {
	return {
		startTime: 1000,
		responseStart: 1000 + timeToFirstByteMs,
		duration: timeToFirstByteMs + 100,
		encodedBodySize: 1,
	}
}

// The time to first byte of `count` timings: 100, 200, ... milliseconds.
function recordSamples(samples: number[], count: number): void {
	for (let i = 1; i <= count; i++) {
		recordTimeToFirstByte(samples, timing(i * 100))
	}
}

describe('recordTimeToFirstByte', () => {
	it('adds the time to first byte in seconds', () => {
		const samples: number[] = []

		recordTimeToFirstByte(samples, timing(250))

		deepEqual(samples, [0.25])
	})

	it('adds nothing for a timing without a usable responseStart', () => {
		const samples: number[] = []

		recordTimeToFirstByte(samples, { startTime: 1000, duration: 100, encodedBodySize: 1 })
		recordTimeToFirstByte(samples, {
			startTime: 1000,
			responseStart: 900,
			duration: 100,
			encodedBodySize: 1,
		})
		recordTimeToFirstByte(samples, {
			startTime: 1000,
			responseStart: 1101,
			duration: 100,
			encodedBodySize: 1,
		})
		recordTimeToFirstByte(samples, {
			startTime: 1000,
			responseStart: 1050,
			duration: NaN,
			encodedBodySize: 1,
		})

		deepEqual(samples, [])
	})

	it('keeps the last four samples', () => {
		const samples: number[] = []

		recordSamples(samples, TIME_TO_FIRST_BYTE_SAMPLE_COUNT + 2)

		deepEqual(samples, [0.3, 0.4, 0.5, 0.6])
	})

	it('keeps a full window when a timing without a usable responseStart arrives', () => {
		const samples: number[] = []

		recordSamples(samples, TIME_TO_FIRST_BYTE_SAMPLE_COUNT)
		recordTimeToFirstByte(samples, { startTime: 1000, duration: 100, encodedBodySize: 1 })

		deepEqual(samples, [0.1, 0.2, 0.3, 0.4])
	})
})
