import type { BitrateSelector, BolaDecision, BolaSelector, LadderRung, SegmentSample } from '@svta/cml-abr'
import { BOLA_DEFAULT_BUFFER_TARGET, BolaState, createBolaSelector, DEFAULT_SAFETY_FACTOR } from '@svta/cml-abr'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { MINIMUM_BUFFER, MINIMUM_BUFFER_PER_RUNG, PLACEHOLDER_DECAY, STALL_THRESHOLD } from '../src/BOLA_CONSTANTS.ts'
import { bolaMaximumBuffers, bolaThresholds, createBolaScoreModel } from './helpers/bolaScoreOracle.ts'
import { closeTo } from './helpers/closeTo.ts'
import { L1_GOLDEN, L2_GOLDEN } from './helpers/goldenRungs.ts'
import { L1, L1_BANDWIDTHS, L2, rungs, withoutRung, withRung } from './helpers/ladders.ts'
import { MILLISECONDS_PER_SECOND } from './helpers/units.ts'

const SEGMENT_DURATION = 4
const DOWNLOAD_DURATION = 400
const TOLERANCE = 1e-6
// The values of the design record have three decimals.
const REFERENCE_TOLERANCE = 0.001
// The start time, in milliseconds, of the second request of a test.
const SECOND_REQUEST_START = 1000
const LONG_WAIT_SECONDS = 60
const LONG_REQUEST_DURATION = 6000
const SMALL_STEP = 0.01
const ONE_BANDWIDTH = 500_000
// A real buffer below the threshold of rung 1, so the buffer alone picks rung 0.
const LOW_BUFFER_LEVEL = 3
const LARGE_BUFFER_TARGET = 40
// A real buffer at which a larger buffer target picks a higher rung than the default target.
const TARGET_CHANGE_BUFFER_LEVEL = 6
const INVALID_BUFFER_LEVELS = [NaN, -1, -Infinity, Infinity]
const INVALID_DURATIONS = [0, -1, NaN, Infinity]
const INVALID_BUFFER_TARGETS = [0, -1, NaN, Infinity]
const SWEEP_STEP = 0.05
const SWEEP_END = 30

const L1_THRESHOLDS = bolaThresholds(L1_BANDWIDTHS, BOLA_DEFAULT_BUFFER_TARGET)
const L1_MAXIMUM_BUFFERS = bolaMaximumBuffers(L1_BANDWIDTHS, BOLA_DEFAULT_BUFFER_TARGET)

// The oscillation guard scenario. The selector is at rung 1. The buffer picks rung 3, which is above the maximum buffer of rung 1.
const GUARD_BUFFER_LEVEL = (L1_THRESHOLDS[3] + L1_THRESHOLDS[4]) / 2

// The ladder change scenario. The selector is at rung 2 of L1. The real buffer is 7 s and the placeholder is 4 s.
const LADDER_CHANGE_BUFFER_LEVEL = 7
const LADDER_CHANGE_PLACEHOLDER = 4
const LADDER_CHANGE_CURRENT_BANDWIDTH = L1_BANDWIDTHS[2]
const NEW_TOP_BANDWIDTH = 12_000_000
const NEW_MIDDLE_BANDWIDTH = 2_200_000
// A buffer high enough to pick above rung 1 in L1 without its middle rung.
const HIGH_BUFFER_LEVEL = 16
// The waits, in seconds, and the real buffer levels of the sweep that checks the conversion.
// From `CONVERSION_SWEEP_START` on, the conversion never needs a negative placeholder for these waits.
const CONVERSION_ELAPSED_SECONDS = [0, 0.5, 1, 2, 3]
const CONVERSION_SWEEP_START = 5
const CONVERSION_SWEEP_STEP = 0.25

// A throughput for which the startup pick is the rung at `position` of L1.
function throughputFor(position: number): number {
	return L1_BANDWIDTHS[position] / DEFAULT_SAFETY_FACTOR + 1
}

// A throughput that sustains the rung at `position` of L1 and not the next one.
function throughputBetween(position: number): number {
	return (L1_BANDWIDTHS[position] + L1_BANDWIDTHS[position + 1]) / 2 / DEFAULT_SAFETY_FACTOR
}

// The time at which a request that starts at `startTime` ends.
function requestEnd(startTime: number): number {
	return startTime + DOWNLOAD_DURATION
}

// Reports a finished segment of `bandwidth` to the selector.
function load(selector: BitrateSelector, bandwidth: number, bufferLevel: number, startTime = 0, extra: Partial<SegmentSample> = {}): void {
	selector.sample({
		timing: { startTime, encodedBodySize: bandwidth / 2, duration: DOWNLOAD_DURATION },
		bandwidth,
		duration: SEGMENT_DURATION,
		bufferLevel,
		...extra,
	})
}

// Moves a selector from the startup state to the steady state. One segment is loaded and the buffer holds one segment.
// The first request starts at 0, so the call to `select` happens at `requestEnd(0)`.
function reachSteadyState(selector: BolaSelector, throughput: number, ladder: LadderRung[] = L1): BolaDecision {
	selector.select({ ladder, bufferLevel: 0, throughput: NaN, now: 0 })
	load(selector, ladder[0].bandwidth, 0)

	return selector.select({ ladder, bufferLevel: SEGMENT_DURATION, throughput, now: requestEnd(0) })
}

// Returns a selector in the steady state with an empty placeholder, so that the real buffer alone decides.
function createEmptyPlaceholderSelector(ladder: LadderRung[] = L1): BolaSelector {
	const selector = createBolaSelector()

	reachSteadyState(selector, throughputFor(1), ladder)
	selector.select({ ladder, bufferLevel: 0, throughput: NaN, now: requestEnd(0) })

	return selector
}

// Returns a selector in the steady state whose current rung is `bandwidth` and whose placeholder is empty.
// The next call at `requestEnd(0)` adds no elapsed time.
function createSteadySelectorAt(bandwidth: number, bufferLevel: number): BolaSelector {
	const selector = createEmptyPlaceholderSelector()

	load(selector, bandwidth, bufferLevel)

	return selector
}

// Decides in the guard scenario for a throughput.
function decideInGuardScenario(throughput: number): BolaDecision {
	return createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL).select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput, now: requestEnd(0) })
}

// Returns the picks of a new selector for a sweep of real buffer levels. The selector is in the steady state with an empty placeholder.
// The player passes `bufferTarget` in every call or in none.
function sweepPicks(ladder: LadderRung[], bufferTarget?: number): number[] {
	const selector = createBolaSelector()
	const common = { ladder, throughput: NaN, bufferTarget }

	selector.select({ ...common, bufferLevel: 0, now: 0 })
	load(selector, ladder[0].bandwidth, 0)
	selector.select({ ...common, bufferLevel: SEGMENT_DURATION, now: requestEnd(0) })
	selector.select({ ...common, bufferLevel: 0, now: requestEnd(0) })

	const picks: number[] = []

	for (let bufferLevel = 0; bufferLevel <= SWEEP_END; bufferLevel += SWEEP_STEP) {
		picks.push(selector.select({ ...common, bufferLevel, now: requestEnd(0) }).index)
	}

	return picks
}

describe('createBolaSelector', () => {
	describe('options', () => {
		it('exports the default buffer target', () => {
			equal(BOLA_DEFAULT_BUFFER_TARGET, 18)
		})

		it('throws when safetyFactor is not a finite number above 0 and at most 1', () => {
			for (const safetyFactor of [0, -0.5, 1.5, NaN, Infinity]) {
				throws(() => createBolaSelector({ safetyFactor }), {
					name: 'RangeError',
					message: `Invalid safetyFactor: expected a finite number above 0 and at most 1, received ${safetyFactor}`,
				})
			}
		})

		it('uses the safety factor for the startup pick', () => {
			const throughput = L1_BANDWIDTHS[2]
			const input = { ladder: L1, bufferLevel: 0, throughput, now: 0 }

			equal(createBolaSelector().select(input).index, 1)
			equal(createBolaSelector({ safetyFactor: 1 }).select(input).index, 2)
		})
	})

	describe('type', () => {
		it('is a BitrateSelector whose decision keeps the state and the placeholder', () => {
			const selector: BitrateSelector = createBolaSelector()
			const decision = createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput: NaN, now: 0 })
			const state: BolaState = decision.state

			equal(typeof selector.select, 'function')
			equal(state, BolaState.STARTUP)
			equal(decision.placeholder, 0)
		})

		it('works as the example of the documentation', () => {
			// #region example
			const selector = createBolaSelector()
			const ladder = [{ bandwidth: 300_000 }, { bandwidth: 750_000 }, { bandwidth: 1_500_000 }, { bandwidth: 3_000_000 }, { bandwidth: 6_000_000 }]

			// First request. No sample exists and the estimate is unknown, so the selector picks rung 0.
			const first = selector.select({ ladder, bufferLevel: 0, throughput: NaN, now: 0 })

			// The player downloads a 4 second segment of rung 0 (150,000 bytes) in 400 ms, at 3 Mbps.
			const timing = { startTime: 0, encodedBodySize: 150_000, duration: 400 }
			selector.sample({ timing, bandwidth: ladder[first.index].bandwidth, duration: 4, bufferLevel: 0 })

			// Second request. The estimate is 3 Mbps, so the selector picks rung 2 (1.5 Mbps).
			const second = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 400 })
			// #endregion example

			equal(first.index, 0)
			equal(second.index, 2)
			equal(second.state, BolaState.STEADY)
		})
	})

	describe('startup state', () => {
		it('picks rung 0 with no placeholder when the throughput is unknown', () => {
			for (const throughput of [NaN, -1, Infinity, -Infinity]) {
				const decision = createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput, now: 0 })

				deepEqual(decision, { index: 0, delay: 0, state: BolaState.STARTUP, placeholder: 0 })
			}
		})

		it('picks rung 0 when no rung fits the throughput', () => {
			const decision = createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput: 0, now: 0 })

			equal(decision.index, 0)
			equal(decision.state, BolaState.STARTUP)
		})

		it('picks the highest rung at or below the throughput times the safety factor', () => {
			L1_BANDWIDTHS.forEach((bandwidth, position) => {
				const above = createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput: bandwidth / DEFAULT_SAFETY_FACTOR + 1, now: 0 })

				equal(above.index, position)

				if (position > 0) {
					const below = createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput: bandwidth / DEFAULT_SAFETY_FACTOR - 1, now: 0 })

					equal(below.index, position - 1)
				}
			})
		})

		it('sets the placeholder to the threshold of the picked rung minus the buffer level', () => {
			const low = createBolaSelector().select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: throughputFor(2), now: 0 })
			const high = createBolaSelector().select({ ladder: L1, bufferLevel: L1_THRESHOLDS[2] + 1, throughput: throughputFor(2), now: 0 })

			closeTo(low.placeholder, L1_THRESHOLDS[2] - LOW_BUFFER_LEVEL, TOLERANCE)
			equal(high.placeholder, 0)
		})

		it('never returns a delay', () => {
			equal(createBolaSelector().select({ ladder: L1, bufferLevel: L1_MAXIMUM_BUFFERS[4] * 2, throughput: throughputFor(1), now: 0 }).delay, 0)
		})

		it('stays in the startup state until a segment is sampled', () => {
			const selector = createBolaSelector()

			for (let call = 0; call < 3; call++) {
				equal(selector.select({ ladder: L1, bufferLevel: MINIMUM_BUFFER, throughput: throughputFor(1), now: call }).state, BolaState.STARTUP)
			}
		})

		it('moves to the steady state in the first call after a sample, when the buffer holds one segment', () => {
			const decision = reachSteadyState(createBolaSelector(), throughputFor(1))

			equal(decision.state, BolaState.STEADY)
			// That call still picks from the throughput.
			equal(decision.index, 1)
		})

		it('stays in the startup state when the buffer holds less than one segment', () => {
			const selector = createBolaSelector()

			selector.select({ ladder: L1, bufferLevel: 0, throughput: NaN, now: 0 })
			load(selector, L1_BANDWIDTHS[0], 0)

			equal(selector.select({ ladder: L1, bufferLevel: SEGMENT_DURATION - SMALL_STEP, throughput: throughputFor(1), now: requestEnd(0) }).state, BolaState.STARTUP)
		})

		it('stays in the startup state when the duration of the sample is not a positive finite number', () => {
			for (const duration of INVALID_DURATIONS) {
				const selector = createBolaSelector()

				selector.select({ ladder: L1, bufferLevel: 0, throughput: NaN, now: 0 })
				load(selector, L1_BANDWIDTHS[0], 0, 0, { duration })

				equal(selector.select({ ladder: L1, bufferLevel: MINIMUM_BUFFER, throughput: throughputFor(1), now: requestEnd(0) }).state, BolaState.STARTUP, `duration ${duration}`)
			}
		})

		it('ignores a buffer at or below the stall threshold', () => {
			const decision = createBolaSelector().select({ ladder: L1, bufferLevel: STALL_THRESHOLD / 2, throughput: throughputFor(2), now: 0 })

			closeTo(decision.placeholder, L1_THRESHOLDS[2] - STALL_THRESHOLD / 2, TOLERANCE)
		})

		it('counts a buffer level that is not finite or is negative as 0', () => {
			const expected = createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput: throughputFor(2), now: 0 })

			for (const bufferLevel of INVALID_BUFFER_LEVELS) {
				deepEqual(createBolaSelector().select({ ladder: L1, bufferLevel, throughput: throughputFor(2), now: 0 }), expected)
			}
		})
	})

	describe('steady state', () => {
		it('picks the rung with the best score for the real buffer when the placeholder is empty', () => {
			for (const [ladder, golden] of [[L1, L1_GOLDEN], [L2, L2_GOLDEN]] as const) {
				const selector = createEmptyPlaceholderSelector(ladder)

				for (const [bufferLevel, expected] of golden) {
					const decision = selector.select({ ladder, bufferLevel, throughput: NaN, now: requestEnd(0) })

					equal(decision.index, expected, `buffer ${bufferLevel}`)
					equal(decision.state, BolaState.STEADY)
					equal(decision.placeholder, 0)
				}
			}
		})

		it('limits an upward switch to the rung that the throughput sustains', () => {
			equal(decideInGuardScenario(throughputFor(4)).index, 3)
			equal(decideInGuardScenario(throughputFor(2)).index, 2)

			const limited = decideInGuardScenario(throughputBetween(1))

			equal(limited.index, 1)
			closeTo(limited.delay, GUARD_BUFFER_LEVEL - L1_MAXIMUM_BUFFERS[1], TOLERANCE)
		})

		it('skips the oscillation guard when the throughput is unknown', () => {
			const decision = decideInGuardScenario(NaN)

			equal(decision.index, 3)
			equal(decision.delay, 0)
		})

		it('treats a throughput of 0 as a measurement', () => {
			equal(decideInGuardScenario(0).index, 1)
		})

		it('never forces a downward switch', () => {
			const decision = createSteadySelectorAt(L1_BANDWIDTHS[4], GUARD_BUFFER_LEVEL).select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput: throughputBetween(1), now: requestEnd(0) })

			equal(decision.index, 3)
		})

		it('returns a delay only above the maximum buffer of the chosen rung', () => {
			const excess = 0.5
			const maximum = L1_MAXIMUM_BUFFERS[1]

			for (const [bufferLevel, expectedDelay] of [[maximum - excess, 0], [maximum, 0], [maximum + excess, excess]]) {
				const decision = createSteadySelectorAt(L1_BANDWIDTHS[1], bufferLevel).select({ ladder: L1, bufferLevel, throughput: throughputBetween(1), now: requestEnd(0) })

				equal(decision.index, 1)
				closeTo(decision.delay, expectedDelay, TOLERANCE, `buffer ${bufferLevel}`)
			}
		})

		it('returns no delay at the top rung', () => {
			const decision = createEmptyPlaceholderSelector().select({ ladder: L1, bufferLevel: L1_MAXIMUM_BUFFERS[4] * 2, throughput: throughputFor(4), now: requestEnd(0) })

			equal(decision.index, 4)
			equal(decision.delay, 0)
		})

		it('returns a delay of 0 in the call after the wait', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)
			const throughput = throughputBetween(1)
			const first = selector.select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput, now: requestEnd(0) })

			ok(first.delay > 0)

			const wait = Math.ceil(first.delay * MILLISECONDS_PER_SECOND)
			const second = selector.select({
				ladder: L1,
				bufferLevel: GUARD_BUFFER_LEVEL - wait / MILLISECONDS_PER_SECOND,
				throughput,
				now: requestEnd(0) + wait,
			})

			equal(second.delay, 0)
			equal(second.index, first.index)
		})

		it('returns the same delay again when the buffer did not drain during the wait', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)
			const throughput = throughputBetween(1)
			const first = selector.select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput, now: requestEnd(0) })
			const second = selector.select({
				ladder: L1,
				bufferLevel: GUARD_BUFFER_LEVEL,
				throughput,
				now: requestEnd(0) + first.delay * MILLISECONDS_PER_SECOND,
			})

			ok(first.delay > 0)
			closeTo(second.delay, first.delay, TOLERANCE)
		})

		it('lets the placeholder absorb the excess before it returns a delay', () => {
			const elapsed = 3
			const bufferLevel = 12
			const now = requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND
			const decision = createSteadySelectorAt(L1_BANDWIDTHS[1], bufferLevel).select({ ladder: L1, bufferLevel, throughput: throughputBetween(1), now })
			const excess = bufferLevel + elapsed - L1_MAXIMUM_BUFFERS[1]

			equal(decision.index, 1)
			equal(decision.delay, 0)
			closeTo(decision.placeholder, elapsed - excess, TOLERANCE)
		})

		it('returns the part of the excess that the placeholder does not absorb as the delay', () => {
			const elapsed = 0.5
			const now = requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND
			const decision = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL).select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput: throughputBetween(1), now })
			const excess = GUARD_BUFFER_LEVEL + elapsed - L1_MAXIMUM_BUFFERS[1]

			equal(decision.index, 1)
			closeTo(decision.delay, excess - elapsed, TOLERANCE)
			equal(decision.placeholder, 0)
		})

		it('clears the placeholder at the top rung without a delay', () => {
			const elapsed = 2
			const bufferLevel = L1_MAXIMUM_BUFFERS[4] + elapsed
			const now = requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND
			const decision = createEmptyPlaceholderSelector().select({ ladder: L1, bufferLevel, throughput: throughputFor(4), now })

			equal(decision.index, 4)
			equal(decision.delay, 0)
			equal(decision.placeholder, 0)
		})

		it('adds the time since the last request ended to the placeholder', () => {
			const elapsed = 2
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL)
			const decision = selector.select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND })

			closeTo(decision.placeholder, elapsed, TOLERANCE)
		})

		it('adds the time since the last call when no request ended in between', () => {
			const elapsed = 3
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL)

			selector.select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) })

			const decision = selector.select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND })

			closeTo(decision.placeholder, elapsed, TOLERANCE)
		})

		it('does not subtract time when the clock goes backwards', () => {
			const elapsed = 3
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL)
			const input = { ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: NaN }
			const first = selector.select({ ...input, now: requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND })
			const second = selector.select({ ...input, now: requestEnd(0) + (elapsed - 1) * MILLISECONDS_PER_SECOND })

			closeTo(first.placeholder, elapsed, TOLERANCE)
			closeTo(second.placeholder, elapsed, TOLERANCE)
		})

		it('skips the elapsed time when now is not finite', () => {
			const elapsed = 2
			const input = { ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: NaN }
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL)
			const control = createSteadySelectorAt(L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL)

			deepEqual(selector.select({ ...input, now: NaN }), control.select({ ...input, now: requestEnd(0) }))

			const later = selector.select({ ...input, now: requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND })

			closeTo(later.placeholder, elapsed, TOLERANCE)
		})
	})

	describe('stalls', () => {
		it('clears the placeholder in select when the buffer is at or below the stall threshold', () => {
			const atThreshold = createBolaSelector()
			const above = createBolaSelector()

			reachSteadyState(atThreshold, throughputFor(1))
			reachSteadyState(above, throughputFor(1))

			equal(atThreshold.select({ ladder: L1, bufferLevel: STALL_THRESHOLD, throughput: NaN, now: requestEnd(0) }).placeholder, 0)
			ok(above.select({ ladder: L1, bufferLevel: STALL_THRESHOLD + SMALL_STEP, throughput: NaN, now: requestEnd(0) }).placeholder > 0)
		})

		it('clears the elapsed time of a long wait in the call that finds the stall', () => {
			const selector = createBolaSelector()

			reachSteadyState(selector, throughputFor(1))

			const decision = selector.select({ ladder: L1, bufferLevel: 0, throughput: NaN, now: requestEnd(0) + LONG_WAIT_SECONDS * MILLISECONDS_PER_SECOND })

			equal(decision.placeholder, 0)
		})

		it('clears the placeholder in sample when the buffer is at or below the stall threshold', () => {
			const stalled = createBolaSelector()
			const control = createBolaSelector()
			const later = requestEnd(SECOND_REQUEST_START)

			reachSteadyState(stalled, throughputFor(1))
			reachSteadyState(control, throughputFor(1))
			load(stalled, L1_BANDWIDTHS[1], STALL_THRESHOLD, SECOND_REQUEST_START)
			load(control, L1_BANDWIDTHS[1], SEGMENT_DURATION, SECOND_REQUEST_START)

			equal(stalled.select({ ladder: L1, bufferLevel: SEGMENT_DURATION, throughput: NaN, now: later }).placeholder, 0)
			ok(control.select({ ladder: L1, bufferLevel: SEGMENT_DURATION, throughput: NaN, now: later }).placeholder > 0)
		})
	})

	describe('sample', () => {
		// A selector in the steady state at rung 1, with the placeholder of the startup call.
		function createSampledSelector(): { selector: BolaSelector, placeholder: number } {
			const selector = createBolaSelector()
			const { placeholder } = reachSteadyState(selector, throughputFor(1))

			return { selector, placeholder }
		}

		it('multiplies the placeholder by the decay', () => {
			const { selector, placeholder } = createSampledSelector()

			load(selector, L1_BANDWIDTHS[1], SEGMENT_DURATION, SECOND_REQUEST_START)

			const decision = selector.select({ ladder: L1, bufferLevel: SEGMENT_DURATION, throughput: NaN, now: requestEnd(SECOND_REQUEST_START) })

			closeTo(decision.placeholder, placeholder * PLACEHOLDER_DECAY, TOLERANCE)
			ok(decision.placeholder < placeholder)
		})

		it('caps the placeholder so that the effective buffer at request start stays at or below the maximum buffer of the rung', () => {
			const { selector } = createSampledSelector()
			const bufferLevel = 8
			const cap = L1_MAXIMUM_BUFFERS[0] - (bufferLevel + DOWNLOAD_DURATION / MILLISECONDS_PER_SECOND)

			load(selector, L1_BANDWIDTHS[0], bufferLevel, SECOND_REQUEST_START)

			const decision = selector.select({ ladder: L1, bufferLevel, throughput: NaN, now: requestEnd(SECOND_REQUEST_START) })

			closeTo(decision.placeholder, cap, TOLERANCE)
		})

		it('adds the segment duration for a replacement segment', () => {
			const { selector, placeholder } = createSampledSelector()

			load(selector, L1_BANDWIDTHS[1], SEGMENT_DURATION, SECOND_REQUEST_START, { isReplacement: true })

			const decision = selector.select({ ladder: L1, bufferLevel: SEGMENT_DURATION, throughput: NaN, now: requestEnd(SECOND_REQUEST_START) })

			closeTo(decision.placeholder, placeholder * PLACEHOLDER_DECAY + SEGMENT_DURATION, TOLERANCE)
		})

		it('caps the placeholder at the threshold of the current rung for an aborted segment', () => {
			const selector = createBolaSelector()
			const bufferLevel = 5

			reachSteadyState(selector, throughputFor(2))
			load(selector, L1_BANDWIDTHS[4], bufferLevel, SECOND_REQUEST_START, { aborted: true })

			const decision = selector.select({ ladder: L1, bufferLevel, throughput: NaN, now: requestEnd(0) })

			closeTo(decision.placeholder, L1_THRESHOLDS[2] - bufferLevel, TOLERANCE)
		})

		it('caps the placeholder so that the effective buffer stays at MINIMUM_BUFFER for an aborted segment at rung 0', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], SEGMENT_DURATION)
			const bufferLevel = 8

			load(selector, L1_BANDWIDTHS[0], bufferLevel, SECOND_REQUEST_START, { isReplacement: true })
			load(selector, L1_BANDWIDTHS[4], bufferLevel, SECOND_REQUEST_START, { aborted: true })

			const decision = selector.select({ ladder: L1, bufferLevel, throughput: NaN, now: requestEnd(SECOND_REQUEST_START) })

			closeTo(decision.placeholder, MINIMUM_BUFFER - bufferLevel, TOLERANCE)
		})

		describe('after a long request', () => {
			// A selector that asks for a rung at `requestEnd(0)` and starts a request.
			// The request ends after `LONG_REQUEST_DURATION` with the given sample fields. The helper returns the selector and the end time.
			function endLongRequest(extra: Partial<SegmentSample>): { selector: BolaSelector, end: number } {
				const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL)
				const timing = { startTime: requestEnd(0), encodedBodySize: 1, duration: LONG_REQUEST_DURATION }

				selector.select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: throughputFor(4), now: requestEnd(0) })
				load(selector, L1_BANDWIDTHS[0], LOW_BUFFER_LEVEL, requestEnd(0), { ...extra, timing })

				return { selector, end: requestEnd(0) + LONG_REQUEST_DURATION }
			}

			for (const [outcome, extra] of [['finished', {}], ['aborted', { aborted: true }]] as const) {
				it(`does not add the download time of the ${outcome} request to the placeholder`, () => {
					const { selector, end } = endLongRequest(extra)
					const decision = selector.select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: throughputFor(4), now: end })

					equal(decision.placeholder, 0)
					equal(decision.index, 0)
				})

				it(`adds the time since the ${outcome} request ended to the placeholder`, () => {
					const elapsed = 2
					const { selector, end } = endLongRequest(extra)
					const decision = selector.select({ ladder: L1, bufferLevel: LOW_BUFFER_LEVEL, throughput: throughputFor(4), now: end + elapsed * MILLISECONDS_PER_SECOND })

					closeTo(decision.placeholder, elapsed, TOLERANCE)
				})
			}
		})

		it('does not change the current rung for an aborted segment', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)

			load(selector, L1_BANDWIDTHS[4], GUARD_BUFFER_LEVEL, SECOND_REQUEST_START, { aborted: true })

			equal(selector.select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput: throughputBetween(1), now: requestEnd(0) }).index, 1)
		})

		it('takes the bandwidth of a sample as the current rung', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[0], GUARD_BUFFER_LEVEL)

			load(selector, L1_BANDWIDTHS[3], GUARD_BUFFER_LEVEL, SECOND_REQUEST_START)

			equal(selector.select({ ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput: throughputBetween(1), now: requestEnd(SECOND_REQUEST_START) }).index, 3)
		})

		it('ignores a sample whose bandwidth is not finite', () => {
			const control = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)
			// The throughput sustains a rung below the current rung, so the guard depends on the current rung.
			const input = { ladder: L1, bufferLevel: GUARD_BUFFER_LEVEL, throughput: throughputFor(0), now: requestEnd(0) }

			load(selector, NaN, GUARD_BUFFER_LEVEL, SECOND_REQUEST_START)

			deepEqual(selector.select(input), control.select(input))
			equal(selector.select(input).index, 1)
		})

		it('counts a buffer level that is not finite or is negative as 0', () => {
			const { selector: control } = createSampledSelector()

			load(control, L1_BANDWIDTHS[1], 0, SECOND_REQUEST_START)

			const input = { ladder: L1, bufferLevel: SEGMENT_DURATION, throughput: NaN, now: requestEnd(SECOND_REQUEST_START) }
			const expected = control.select(input)

			equal(expected.placeholder, 0)

			for (const bufferLevel of INVALID_BUFFER_LEVELS) {
				const { selector } = createSampledSelector()

				load(selector, L1_BANDWIDTHS[1], bufferLevel, SECOND_REQUEST_START)

				deepEqual(selector.select(input), expected, `buffer level ${bufferLevel}`)
			}
		})

		it('accepts a sample before the first call to select', () => {
			const selector = createBolaSelector()

			load(selector, L1_BANDWIDTHS[0], 0)

			equal(selector.select({ ladder: L1, bufferLevel: SEGMENT_DURATION, throughput: throughputFor(1), now: requestEnd(0) }).state, BolaState.STEADY)
		})
	})

	describe('one distinct rung', () => {
		it('returns the highest index of that rung with no delay and no placeholder', () => {
			const input = { bufferLevel: LOW_BUFFER_LEVEL, throughput: L1_BANDWIDTHS[4], now: 0 }

			deepEqual(createBolaSelector().select({ ladder: rungs(ONE_BANDWIDTH), ...input }), { index: 0, delay: 0, state: BolaState.STARTUP, placeholder: 0 })
			deepEqual(createBolaSelector().select({ ladder: rungs(ONE_BANDWIDTH, ONE_BANDWIDTH), ...input }), { index: 1, delay: 0, state: BolaState.STARTUP, placeholder: 0 })
		})

		it('keeps the startup state after samples', () => {
			const selector = createBolaSelector()
			const ladder = rungs(ONE_BANDWIDTH)

			selector.select({ ladder, bufferLevel: 0, throughput: NaN, now: 0 })
			load(selector, ONE_BANDWIDTH, SEGMENT_DURATION)

			equal(selector.select({ ladder, bufferLevel: SEGMENT_DURATION, throughput: NaN, now: requestEnd(0) }).state, BolaState.STARTUP)
		})
	})

	describe('reset', () => {
		it('returns the selector to its initial state', () => {
			const selector = createBolaSelector()
			const input = { ladder: L1, bufferLevel: 1, throughput: throughputFor(2), now: 0 }

			reachSteadyState(selector, throughputFor(2))
			selector.reset()

			deepEqual(selector.select(input), createBolaSelector().select(input))
		})

		it('needs a new sample before the steady state', () => {
			const selector = createBolaSelector()

			reachSteadyState(selector, throughputFor(2))
			selector.reset()

			equal(selector.select({ ladder: L1, bufferLevel: MINIMUM_BUFFER, throughput: throughputFor(2), now: 0 }).state, BolaState.STARTUP)
		})
	})

	describe('ladder changes', () => {
		// A selector in the steady state at rung 2 of L1. It has the real buffer and the placeholder of the scenario.
		function createSelectorForLadderChange(): BolaSelector {
			const selector = createBolaSelector()

			selector.select({ ladder: L1, bufferLevel: 0, throughput: NaN, now: 0 })
			load(selector, L1_BANDWIDTHS[0], 0)
			selector.select({ ladder: L1, bufferLevel: L1_THRESHOLDS[2] - LADDER_CHANGE_PLACEHOLDER, throughput: throughputFor(2), now: requestEnd(0) })

			const settled = selector.select({ ladder: L1, bufferLevel: LADDER_CHANGE_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) })

			equal(settled.index, 2)
			closeTo(settled.placeholder, LADDER_CHANGE_PLACEHOLDER, TOLERANCE)

			return selector
		}

		function change(ladder: LadderRung[], bufferTarget?: number): { bandwidth: number, placeholder: number } {
			const decision = createSelectorForLadderChange().select({ ladder, bufferLevel: LADDER_CHANGE_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0), bufferTarget })

			return { bandwidth: ladder[decision.index].bandwidth, placeholder: decision.placeholder }
		}

		it('keeps the pick and the placeholder when nothing changes', () => {
			const result = change(L1)

			equal(result.bandwidth, LADDER_CHANGE_CURRENT_BANDWIDTH)
			closeTo(result.placeholder, LADDER_CHANGE_PLACEHOLDER, REFERENCE_TOLERANCE)
		})

		it('converts the placeholder when a rung is added at the top', () => {
			const result = change(withRung(L1, NEW_TOP_BANDWIDTH))

			equal(result.bandwidth, LADDER_CHANGE_CURRENT_BANDWIDTH)
			closeTo(result.placeholder, 3.975, REFERENCE_TOLERANCE)
		})

		it('converts the placeholder when the top rung is removed', () => {
			const result = change(withoutRung(L1, L1.length - 1))

			equal(result.bandwidth, LADDER_CHANGE_CURRENT_BANDWIDTH)
			closeTo(result.placeholder, 4.041, REFERENCE_TOLERANCE)
		})

		it('converts the placeholder when the lowest rung is removed', () => {
			const result = change(withoutRung(L1, 0))

			equal(result.bandwidth, LADDER_CHANGE_CURRENT_BANDWIDTH)
			closeTo(result.placeholder, 0.627, REFERENCE_TOLERANCE)
		})

		it('converts the placeholder when a rung is added in the middle', () => {
			const result = change(withRung(L1, NEW_MIDDLE_BANDWIDTH))

			equal(result.bandwidth, LADDER_CHANGE_CURRENT_BANDWIDTH)
			closeTo(result.placeholder, 4.2, REFERENCE_TOLERANCE)
		})

		it('keeps the decision when the buffer target changes', () => {
			const result = change(L1, LARGE_BUFFER_TARGET)

			equal(result.bandwidth, LADDER_CHANGE_CURRENT_BANDWIDTH)
			closeTo(result.placeholder, 6, REFERENCE_TOLERANCE)
		})

		it('keeps the pick for any wait when the buffer target changes', () => {
			for (const elapsed of CONVERSION_ELAPSED_SECONDS) {
				const now = requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND

				for (let bufferLevel = CONVERSION_SWEEP_START; bufferLevel <= SWEEP_END; bufferLevel += CONVERSION_SWEEP_STEP) {
					const input = { ladder: L1, bufferLevel, throughput: NaN, now }
					const control = createSelectorForLadderChange().select(input)
					const changed = createSelectorForLadderChange().select({ ...input, bufferTarget: LARGE_BUFFER_TARGET })

					equal(changed.index, control.index, `wait ${elapsed} s, buffer ${bufferLevel} s`)
				}
			}
		})

		it('picks by the real buffer alone when the conversion would need a negative placeholder', () => {
			const selector = createEmptyPlaceholderSelector()
			const input = { ladder: L1, bufferLevel: TARGET_CHANGE_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) }
			const before = selector.select(input)
			const after = selector.select({ ...input, bufferTarget: LARGE_BUFFER_TARGET })

			equal(after.placeholder, 0)
			equal(after.index, createBolaScoreModel(L1_BANDWIDTHS, LARGE_BUFFER_TARGET).best(TARGET_CHANGE_BUFFER_LEVEL))
			ok(after.index > before.index)
		})

		it('maps the current rung to the highest rung at or below it when its rung is removed', () => {
			const ladder = withoutRung(L1, 2)
			const selector = createSteadySelectorAt(LADDER_CHANGE_CURRENT_BANDWIDTH, HIGH_BUFFER_LEVEL)
			// The throughput sustains the lowest rung, so the guard keeps the current rung.
			const decision = selector.select({ ladder, bufferLevel: HIGH_BUFFER_LEVEL, throughput: throughputFor(0), now: requestEnd(0) })

			equal(ladder[decision.index].bandwidth, L1_BANDWIDTHS[1])
		})

		it('detects a change made in place to the array of the caller', () => {
			const mutated = rungs(...L1_BANDWIDTHS)
			const replaced = withRung(withoutRung(L1, L1.length - 1), NEW_TOP_BANDWIDTH)
			const selector = createBolaSelector()
			const input = { bufferLevel: LOW_BUFFER_LEVEL, throughput: throughputFor(2), now: 0 }

			selector.select({ ladder: mutated, ...input })
			mutated[L1.length - 1].bandwidth = NEW_TOP_BANDWIDTH

			deepEqual(selector.select({ ladder: mutated, ...input }), createBolaSelector().select({ ladder: replaced, ...input }))
		})

		it('restarts when the ladder loses its second distinct rung and when it gains one again', () => {
			const selector = createSelectorForLadderChange()
			const single = rungs(LADDER_CHANGE_CURRENT_BANDWIDTH)

			deepEqual(selector.select({ ladder: single, bufferLevel: LADDER_CHANGE_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) }), { index: 0, delay: 0, state: BolaState.STARTUP, placeholder: 0 })

			const again = selector.select({ ladder: L1, bufferLevel: LADDER_CHANGE_BUFFER_LEVEL, throughput: throughputFor(3), now: requestEnd(0) })

			equal(again.state, BolaState.STARTUP)
			equal(again.index, 3)
			closeTo(again.placeholder, Math.max(0, L1_THRESHOLDS[3] - LADDER_CHANGE_BUFFER_LEVEL), TOLERANCE)
		})

		it('does not change any state when the new ladder is invalid', () => {
			const selector = createSelectorForLadderChange()
			const control = createSelectorForLadderChange()
			const input = { ladder: L1, bufferLevel: LADDER_CHANGE_BUFFER_LEVEL, throughput: NaN, now: requestEnd(0) }

			throws(() => selector.select({ ...input, ladder: rungs(L1_BANDWIDTHS[1], L1_BANDWIDTHS[0]) }), { name: 'RangeError' })
			throws(() => selector.select({ ...input, bufferTarget: -1 }), { name: 'RangeError' })

			deepEqual(selector.select(input), control.select(input))
		})
	})

	describe('buffer target', () => {
		it('uses BOLA_DEFAULT_BUFFER_TARGET when the field is omitted', () => {
			// Three rungs give a smallest buffer time below the default, so the default decides the thresholds.
			const ladder = rungs(...L1_BANDWIDTHS.slice(0, 3))
			const byDefault = sweepPicks(ladder)
			const nextLower = sweepPicks(ladder, BOLA_DEFAULT_BUFFER_TARGET - 1)

			deepEqual(byDefault, sweepPicks(ladder, BOLA_DEFAULT_BUFFER_TARGET))
			ok(byDefault.some((pick, i) => pick !== nextLower[i]), 'the sweep tells the default apart from the next lower target')
		})

		it('throws a RangeError for a value that is not a positive finite number', () => {
			for (const bufferTarget of INVALID_BUFFER_TARGETS) {
				throws(() => createBolaSelector().select({ ladder: L1, bufferLevel: 0, throughput: NaN, now: 0, bufferTarget }), {
					name: 'RangeError',
					message: `Invalid bufferTarget: expected a positive finite number of seconds, received ${bufferTarget}`,
				})
			}
		})

		it('raises a value below the smallest buffer time', () => {
			const smallest = MINIMUM_BUFFER + MINIMUM_BUFFER_PER_RUNG * L1.length

			deepEqual(sweepPicks(L1, 1), sweepPicks(L1, smallest))
		})
	})

	describe('input validation', () => {
		it('throws the errors of the shared ladder validation', () => {
			const input = { bufferLevel: 0, throughput: NaN, now: 0 }
			const [low, high] = L1_BANDWIDTHS

			throws(() => createBolaSelector().select({ ladder: [], ...input }), { name: 'RangeError', message: 'Invalid ladder: expected at least one rung, received an empty array' })
			throws(() => createBolaSelector().select({ ladder: rungs(low, NaN), ...input }), { name: 'RangeError', message: 'Invalid ladder: expected a positive finite bandwidth at 1, received NaN' })
			throws(() => createBolaSelector().select({ ladder: rungs(high, low), ...input }), { name: 'RangeError', message: `Invalid ladder: expected ascending bandwidth, received ${high} at 0 and ${low} at 1` })
		})

		it('accepts equal neighbouring bandwidths and returns the highest index', () => {
			const ladder = rungs(L1_BANDWIDTHS[0], L1_BANDWIDTHS[1], L1_BANDWIDTHS[1], L1_BANDWIDTHS[2])
			const decision = createBolaSelector().select({ ladder, bufferLevel: 0, throughput: throughputFor(1), now: 0 })

			equal(decision.index, 2)
		})
	})
})
