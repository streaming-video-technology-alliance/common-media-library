import { equal } from 'node:assert'
import { describe, it } from 'vitest'
import { applyStarvationGuard } from '../src/applyStarvationGuard.ts'
import { L1, L1_BANDWIDTHS } from './helpers/ladders.ts'

const SEGMENT_DURATION = 4
const TOP = L1.length - 1
// The top rung of L1 downloads in one segment duration at this throughput. Each lower rung downloads in less time.
const SAFE_THROUGHPUT = L1_BANDWIDTHS[TOP]
const NO_TOLERANCE = 0

// The seconds that the rung at `position` needs to download one segment at `SAFE_THROUGHPUT`.
function downloadSeconds(position: number): number {
	return (L1_BANDWIDTHS[position] * SEGMENT_DURATION) / SAFE_THROUGHPUT
}

function guard(index: number, budget: number, tolerance = NO_TOLERANCE): number {
	return applyStarvationGuard(L1, index, SEGMENT_DURATION, SAFE_THROUGHPUT, budget, tolerance)
}

describe('applyStarvationGuard', () => {
	it('keeps the pick when its download fits in the budget', () => {
		equal(guard(TOP, downloadSeconds(TOP)), TOP)
	})

	it('lowers the pick to the highest rung whose download fits in the budget', () => {
		const budget = (downloadSeconds(2) + downloadSeconds(3)) / 2

		equal(guard(TOP, budget), 2)
	})

	it('never raises the pick', () => {
		equal(guard(1, downloadSeconds(TOP)), 1)
	})

	it('uses the second pass when no rung fits the budget and the tolerance allows one', () => {
		const budget = downloadSeconds(0) / 2
		const tolerance = downloadSeconds(2)

		equal(guard(TOP, budget, tolerance), 2)
	})

	it('returns rung 0 when no rung fits the budget and the tolerance', () => {
		const budget = downloadSeconds(0) / 2

		equal(guard(TOP, budget, downloadSeconds(0) / 4), 0)
	})

	it('has one pass and falls back to rung 0 when the tolerance is 0', () => {
		equal(guard(TOP, downloadSeconds(0) / 2), 0)
	})

	it('treats a throughput of 0 as a download that never ends', () => {
		equal(applyStarvationGuard(L1, TOP, SEGMENT_DURATION, 0, downloadSeconds(TOP), NO_TOLERANCE), 0)
	})
})
