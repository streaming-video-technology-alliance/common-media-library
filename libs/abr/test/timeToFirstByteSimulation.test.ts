import type { BitrateSelector, LadderRung } from '@svta/cml-abr'
import { createBolaSelector, createThroughputSelector } from '@svta/cml-abr'
import { equal, ok } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { L1, L2 } from './helpers/ladders.ts'
import { createRandomWalkTrace, simulatePlayback } from './helpers/simulatePlayback.ts'
import { renderTimeToFirstByteReport } from './helpers/timeToFirstByteReport.ts'

const SEGMENT_COUNT = 75
const SEED_COUNT = 20
const MINIMUM_BANDWIDTH = 600_000
const MAXIMUM_BANDWIDTH = 9_000_000
const BUFFER_CAP = 18
// The high wait scenario of the RFC analysis: 800 ms before the first byte and 2 second segments.
const HIGH_WAIT = 0.8
const SHORT_SEGMENT = 2
// Two header lines and one row for each combination of 3 setups, 2 scenarios, 2 selectors, and 2 option states.
const REPORT_LINE_COUNT = 26

type Totals = { stalls: number; switches: number }

const SELECTORS: [string, (ignoreTimeToFirstByte: boolean) => BitrateSelector][] = [
	['the BOLA selector', ignoreTimeToFirstByte => createBolaSelector({ ignoreTimeToFirstByte })],
	[
		'the throughput selector',
		ignoreTimeToFirstByte => createThroughputSelector({ ignoreTimeToFirstByte }),
	],
]

// The totals over the seeds. With `ignoreTimeToFirstByte` the selector uses no time to first byte in the pick or in the guard.
function totals(
	createSelector: (ignoreTimeToFirstByte: boolean) => BitrateSelector,
	ladder: LadderRung[],
	ignoreTimeToFirstByte: boolean,
): Totals {
	const result: Totals = { stalls: 0, switches: 0 }

	for (let seed = 1; seed <= SEED_COUNT; seed++) {
		const run = simulatePlayback(createSelector(ignoreTimeToFirstByte), {
			ladder,
			trace: createRandomWalkTrace(seed, MINIMUM_BANDWIDTH, MAXIMUM_BANDWIDTH),
			bufferCap: BUFFER_CAP,
			segmentCount: SEGMENT_COUNT,
			segmentDuration: SHORT_SEGMENT,
			timeToFirstByte: HIGH_WAIT,
		})

		result.stalls += run.stallCount
		result.switches += run.switchCount
	}

	return result
}

describe('time to first byte simulation', () => {
	it('stalls and switches less with the time to first byte counted than ignored in the high wait scenario', () => {
		for (const [name, createSelector] of SELECTORS) {
			for (const ladder of [L1, L2]) {
				const bounded = totals(createSelector, ladder, false)
				const unbounded = totals(createSelector, ladder, true)
				const context = `${name}, ${ladder.length} rungs`

				ok(
					bounded.stalls < unbounded.stalls,
					`${context}: stalls ${bounded.stalls} vs ${unbounded.stalls}`,
				)
				ok(
					bounded.switches < unbounded.switches,
					`${context}: switches ${bounded.switches} vs ${unbounded.switches}`,
				)
			}
		}
	})

	it('renders a report with two header lines and 24 rows', () => {
		equal(renderTimeToFirstByteReport(1).split('\n').length, REPORT_LINE_COUNT)
	})
})
