import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { findRung } from '../src/findRung.ts'

const ladder = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000]

describe('findRung', () => {
	it('returns the position of the highest rung at or below the bitrate', () => {
		equal(findRung(ladder, 2_700_000), 2)
		equal(findRung(ladder, 1_500_000), 2)
		equal(findRung(ladder, 1_499_999), 1)
	})

	it('returns the last position when every rung is at or below the bitrate', () => {
		equal(findRung(ladder, 6_000_000), 4)
		equal(findRung(ladder, 10_000_000), 4)
	})

	it('returns 0 when no rung is at or below the bitrate', () => {
		equal(findRung(ladder, 200_000), 0)
		equal(findRung(ladder, 0), 0)
	})

	it('returns the highest position of equal rungs', () => {
		equal(findRung([300_000, 750_000, 750_000, 1_500_000], 750_000), 2)
	})

	it('returns 0 for a ladder with one rung', () => {
		equal(findRung([300_000], 100), 0)
		equal(findRung([300_000], 1_000_000), 0)
	})
})
