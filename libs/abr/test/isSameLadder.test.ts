import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { isSameLadder } from '../src/isSameLadder.ts'
import { bandwidthsOf, L1, L1_BANDWIDTHS, rungs, withRung } from './helpers/ladders.ts'

const MIDDLE = 2
const TOP = L1.length - 1

describe('isSameLadder', () => {
	it('returns true for equal bandwidths in the same order', () => {
		equal(isSameLadder(L1, L1_BANDWIDTHS), true)
		equal(isSameLadder(rungs(...L1_BANDWIDTHS), L1_BANDWIDTHS), true)
	})

	it('returns false when the length differs', () => {
		equal(isSameLadder(L1, L1_BANDWIDTHS.slice(1)), false)
		equal(isSameLadder(withRung(L1, L1_BANDWIDTHS[TOP] * 2), L1_BANDWIDTHS), false)
	})

	it('returns false when a bandwidth differs', () => {
		equal(isSameLadder(rungs(...L1_BANDWIDTHS.slice(0, TOP), L1_BANDWIDTHS[TOP] + 1), L1_BANDWIDTHS), false)
	})

	it('detects a change made in place', () => {
		const ladder = rungs(...L1_BANDWIDTHS)
		const stored = bandwidthsOf(ladder)

		equal(isSameLadder(ladder, stored), true)

		ladder[MIDDLE].bandwidth += 1

		equal(isSameLadder(ladder, stored), false)
	})

	it('returns true for two empty ladders', () => {
		equal(isSameLadder([], []), true)
	})
})
