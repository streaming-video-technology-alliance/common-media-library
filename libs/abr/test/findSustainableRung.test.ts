import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { findRung } from '../src/findRung.ts'
import { findSustainableRung } from '../src/findSustainableRung.ts'
import { L1, rungs } from './helpers/ladders.ts'

// 0.9 times 6 Mbps. Rung 3 of L1 (3 Mbps) transfers one 2 second segment in 1.11 s at this throughput.
const SAFE_THROUGHPUT = 5_400_000
const SEGMENT_DURATION = 2
const NORMAL_RATE = 1
const NO_TIME_TO_FIRST_BYTE = 0

describe('findSustainableRung', () => {
	it('falls back to findRung without a segment duration', () => {
		equal(
			findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, undefined, 0.8),
			findRung(L1, SAFE_THROUGHPUT),
		)
		equal(
			findSustainableRung(L1, SAFE_THROUGHPUT, 2, undefined, 0.8),
			findRung(L1, SAFE_THROUGHPUT / 2),
		)
	})

	it('matches findRung with a time to first byte of 0', () => {
		for (const safeThroughput of [500_000, 1_000_000, 2_000_000, 4_000_000, 8_000_000]) {
			equal(
				findSustainableRung(L1, safeThroughput, NORMAL_RATE, 4, NO_TIME_TO_FIRST_BYTE),
				findRung(L1, safeThroughput),
				`safe throughput ${safeThroughput}`,
			)
		}
	})

	it('lowers the rung when the time to first byte does not leave room for the transfer', () => {
		// Rung 3 needs 1.11 s of transfer. With a time to first byte of 1 s the download takes 2.11 s, more than one segment.
		equal(
			findSustainableRung(
				L1,
				SAFE_THROUGHPUT,
				NORMAL_RATE,
				SEGMENT_DURATION,
				NO_TIME_TO_FIRST_BYTE,
			),
			3,
		)
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, SEGMENT_DURATION, 1), 2)
	})

	it('returns 0 when the time to first byte reaches the budget', () => {
		equal(
			findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, SEGMENT_DURATION, SEGMENT_DURATION),
			0,
		)
	})

	it('accepts a download that takes exactly the budget', () => {
		// Rung 4 (6 Mbps) transfers a 2 second segment in exactly 2 seconds at 6 Mbps. 12 / 6 is exact in floating point.
		equal(
			findSustainableRung(L1, 6_000_000, NORMAL_RATE, SEGMENT_DURATION, NO_TIME_TO_FIRST_BYTE),
			4,
		)
	})

	it('returns the highest position among equal bandwidths', () => {
		const ladder = rungs(300_000, 750_000, 750_000, 1_500_000)

		equal(findSustainableRung(ladder, 1_000_000, NORMAL_RATE, 4, NO_TIME_TO_FIRST_BYTE), 2)
	})

	it('divides the budget by the playback rate', () => {
		// At 2x the segment must arrive in 1 s. Rung 3 needs 1.11 s, rung 2 needs 0.56 s.
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, 2, SEGMENT_DURATION, NO_TIME_TO_FIRST_BYTE), 2)
	})
})
