import type { BitrateSelector, LadderRung } from '@svta/cml-abr'
import { createBolaSelector, createThroughputSelector } from '@svta/cml-abr'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { bandwidthsOf, L1, L2 } from './helpers/ladders.ts'
import type { SimulationResult } from './helpers/simulatePlayback.ts'
import { createConstantTrace, createRandomWalkTrace, simulatePlayback } from './helpers/simulatePlayback.ts'

const SEGMENT_DURATION = 4
const SEGMENT_COUNT = 75
const SEED_COUNT = 20
const MINIMUM_BANDWIDTH = 600_000
const MAXIMUM_BANDWIDTH = 9_000_000
const FAST_LINK = 20_000_000
const SLOW_LINK = 400_000
const STEADY_LINK = 2_000_000
const LAST_SEGMENTS = 5
// The top rung of L1 needs 6 Mbps. A link of 2 Mbps sustains its third rung.
const STEADY_LINK_RUNG = L1[2].bandwidth

type Setup = { name: string; ladder: LadderRung[]; bufferCap: number }

// The buffer time of BOLA is 20 s for L1 and 30 s for L2. Two setups use a cap below that time.
const SETUPS: Setup[] = [
	{ name: 'L1 with a cap of 18 s', ladder: L1, bufferCap: 18 },
	{ name: 'L2 with a cap of 18 s', ladder: L2, bufferCap: 18 },
	{ name: 'L2 with a cap of 30 s', ladder: L2, bufferCap: 30 },
]

const createBola = (): BitrateSelector => createBolaSelector()
const createThroughput = (): BitrateSelector => createThroughputSelector()

const SELECTORS: [string, () => BitrateSelector][] = [
	['the BOLA selector', createBola],
	['the throughput selector', createThroughput],
]

function play(
	createSelector: () => BitrateSelector,
	setup: Setup,
	seed: number,
	omitSegmentDuration = false,
): SimulationResult {
	return simulatePlayback(createSelector(), {
		ladder: setup.ladder,
		trace: createRandomWalkTrace(seed, MINIMUM_BANDWIDTH, MAXIMUM_BANDWIDTH),
		bufferCap: setup.bufferCap,
		segmentCount: SEGMENT_COUNT,
		segmentDuration: SEGMENT_DURATION,
		omitSegmentDuration,
	})
}

function playOnLink(setup: Setup, bandwidth: number): SimulationResult {
	return simulatePlayback(createBolaSelector(), {
		ladder: setup.ladder,
		trace: createConstantTrace(bandwidth),
		bufferCap: setup.bufferCap,
		segmentCount: SEGMENT_COUNT,
		segmentDuration: SEGMENT_DURATION,
	})
}

function average(values: readonly number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length
}

// The stalls of all the seeds. A player that omits `segmentDuration` makes a selector skip its starvation guard.
function totalStalls(createSelector: () => BitrateSelector, setup: Setup, omitSegmentDuration = false): number {
	return Array.from(
		{ length: SEED_COUNT },
		(_, index) => play(createSelector, setup, index + 1, omitSegmentDuration).stallCount,
	).reduce((sum, count) => sum + count, 0)
}

// The mean bandwidth of the rungs that a selector used, averaged over the seeds.
function averageBandwidth(createSelector: () => BitrateSelector, setup: Setup): number {
	const perSeed = Array.from({ length: SEED_COUNT }, (_, index) =>
		average(play(createSelector, setup, index + 1).bandwidths),
	)

	return average(perSeed)
}

describe('playback simulation', () => {
	it('gives the same result for the same seed', () => {
		for (const setup of SETUPS) {
			deepEqual(play(createBola, setup, 1), play(createBola, setup, 1))
		}
	})

	it('follows the contract of the selector type on a varying link', () => {
		for (const [selectorName, createSelector] of SELECTORS) {
			for (const setup of SETUPS) {
				const bandwidths = new Set(bandwidthsOf(setup.ladder))

				for (let seed = 1; seed <= SEED_COUNT; seed++) {
					const result = play(createSelector, setup, seed)
					const context = `${selectorName}, ${setup.name}, seed ${seed}`

					equal(result.bandwidths.length, SEGMENT_COUNT, context)
					ok(
						result.bandwidths.every(bandwidth => bandwidths.has(bandwidth)),
						`${context}: every rung is in the ladder`,
					)
					ok(
						result.delays.every(delay => Number.isFinite(delay) && delay >= 0),
						`${context}: every delay is finite and not negative`,
					)
					equal(result.repeatedDelays, 0, `${context}: the call after a wait returns no delay`)
				}
			}
		}
	})

	// The higher bitrate comes with more stalls, even with the starvation guard. The analysis of the RFC lists both numbers.
	it('picks a higher average rung than the throughput selector on the same traces', () => {
		for (const setup of SETUPS) {
			ok(averageBandwidth(createBola, setup) > averageBandwidth(createThroughput, setup), setup.name)
		}
	})

	it('stalls less with the starvation guard than without it on the same traces', () => {
		for (const setup of SETUPS) {
			ok(totalStalls(createBola, setup) < totalStalls(createBola, setup, true), setup.name)
		}
	})

	it('reaches the top rung on a fast link, even when the buffer cap is below the buffer time of BOLA', () => {
		for (const setup of SETUPS) {
			const top = setup.ladder[setup.ladder.length - 1].bandwidth
			const result = playOnLink(setup, FAST_LINK)

			deepEqual(result.bandwidths.slice(-LAST_SEGMENTS), new Array(LAST_SEGMENTS).fill(top), setup.name)
			equal(result.stallCount, 0, setup.name)
		}
	})

	it('stays at the lowest rung without a stall on a slow link', () => {
		for (const setup of SETUPS) {
			const result = playOnLink(setup, SLOW_LINK)

			equal(new Set(result.bandwidths).size, 1, setup.name)
			equal(result.bandwidths[0], setup.ladder[0].bandwidth, setup.name)
			equal(result.stallCount, 0, setup.name)
		}
	})

	it('settles on the rung that a steady link sustains without a stall', () => {
		const result = playOnLink(SETUPS[0], STEADY_LINK)

		deepEqual(result.bandwidths.slice(-LAST_SEGMENTS), new Array(LAST_SEGMENTS).fill(STEADY_LINK_RUNG))
		equal(result.stallCount, 0)
	})
})
