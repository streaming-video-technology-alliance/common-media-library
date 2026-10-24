import type { BitrateSelector, LadderRung } from '@svta/cml-abr'
import { createBolaSelector, createThroughputSelector } from '@svta/cml-abr'
import { L1, L2 } from './ladders.ts'
import { createRandomWalkTrace, simulatePlayback } from './simulatePlayback.ts'

const SEGMENT_COUNT = 75
const MINIMUM_BANDWIDTH = 600_000
const MAXIMUM_BANDWIDTH = 9_000_000
const BITS_PER_MEGABIT = 1_000_000

type Setup = { name: string; ladder: LadderRung[]; bufferCap: number }
type Scenario = { name: string; timeToFirstByte: number; segmentDuration: number }

const SETUPS: Setup[] = [
	{ name: '5 rungs, 18 s', ladder: L1, bufferCap: 18 },
	{ name: '10 rungs, 18 s', ladder: L2, bufferCap: 18 },
	{ name: '10 rungs, 30 s', ladder: L2, bufferCap: 30 },
]

const SCENARIOS: Scenario[] = [
	{ name: 'Low wait, 100 ms, 4 s segments', timeToFirstByte: 0.1, segmentDuration: 4 },
	{ name: 'High wait, 800 ms, 2 s segments', timeToFirstByte: 0.8, segmentDuration: 2 },
]

const SELECTORS: [string, (ignoreTimeToFirstByte: boolean) => BitrateSelector][] = [
	['BOLA', ignoreTimeToFirstByte => createBolaSelector({ ignoreTimeToFirstByte })],
	['Throughput', ignoreTimeToFirstByte => createThroughputSelector({ ignoreTimeToFirstByte })],
]

/**
 * Renders the RFC analysis table: average Mbps, stalls per session, and switches per session,
 * for every setup, scenario, selector, and option state, averaged over `seedCount` traces.
 */
export function renderTimeToFirstByteReport(seedCount: number): string {
	const lines = [
		'| Ladder and buffer cap | Scenario | Selector | Time to first byte | Average Mbps | Stalls per session | Switches per session |',
		'|---|---|---|---|---|---|---|',
	]

	for (const setup of SETUPS) {
		for (const scenario of SCENARIOS) {
			for (const [selectorName, createSelector] of SELECTORS) {
				for (const ignoreTimeToFirstByte of [false, true]) {
					let bandwidth = 0
					let stalls = 0
					let switches = 0

					for (let seed = 1; seed <= seedCount; seed++) {
						const run = simulatePlayback(createSelector(ignoreTimeToFirstByte), {
							ladder: setup.ladder,
							trace: createRandomWalkTrace(seed, MINIMUM_BANDWIDTH, MAXIMUM_BANDWIDTH),
							bufferCap: setup.bufferCap,
							segmentCount: SEGMENT_COUNT,
							segmentDuration: scenario.segmentDuration,
							timeToFirstByte: scenario.timeToFirstByte,
						})

						bandwidth +=
							run.bandwidths.reduce((sum, value) => sum + value, 0) / run.bandwidths.length
						stalls += run.stallCount
						switches += run.switchCount
					}

					lines.push(
						`| ${setup.name} | ${scenario.name} | ${selectorName} | ${ignoreTimeToFirstByte ? 'Ignored' : 'Counted'} | ` +
							`${(bandwidth / seedCount / BITS_PER_MEGABIT).toFixed(2)} | ${(stalls / seedCount).toFixed(2)} | ${(switches / seedCount).toFixed(1)} |`,
					)
				}
			}
		}
	}

	return lines.join('\n')
}
