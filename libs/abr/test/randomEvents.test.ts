import type {
	BitrateSelectorInput,
	BolaDecision,
	BolaSelector,
	LadderRung,
	SegmentSample,
} from '@svta/cml-abr'
import {
	BOLA_DEFAULT_BUFFER_TARGET,
	BolaState,
	createBolaSelector,
	DEFAULT_STARVATION_SAFETY_FACTOR,
} from '@svta/cml-abr'
import { equal, ok } from 'node:assert'
import { describe, it } from 'vitest'
import { L1, L2, rungs, withoutRung, withRung } from './helpers/ladders.ts'
import { createSeededRandom } from './helpers/seededRandom.ts'
import { MILLISECONDS_PER_SECOND } from './helpers/units.ts'

const SEQUENCE_COUNT = 200
const EVENTS_PER_SEQUENCE = 300
const SEGMENT_DURATION = 4
// The number of finished samples that the starvation guard waits for.
const FINISHED_SAMPLES_FOR_GUARD = 2
const MAXIMUM_BUFFER_LEVEL = 40
const BUFFER_STEP_SPREAD = 8
const MINIMUM_REQUEST_DURATION = 20
const REQUEST_DURATION_SPREAD = 4000
const MAXIMUM_THROUGHPUT = 12_000_000
const MAXIMUM_WAIT = 3000
const MINIMUM_PLAYBACK_RATE = 0.5
const PLAYBACK_RATE_SPREAD = 1.5
const NEW_TOP_BANDWIDTH = 12_000_000
const ONE_BANDWIDTH = 500_000

const RESET_PROBABILITY = 0.02
const LADDER_CHANGE_PROBABILITY = 0.15
const TARGET_CHANGE_PROBABILITY = 0.1
const BUFFER_TARGET_USE_PROBABILITY = 0.5
const UNKNOWN_THROUGHPUT_PROBABILITY = 0.1
const SEGMENT_DURATION_PASS_PROBABILITY = 0.7
const PLAYBACK_RATE_PASS_PROBABILITY = 0.3
const STALL_PROBABILITY = 0.1
const INVALID_BUFFER_LEVEL_PROBABILITY = 0.02
const ABORT_PROBABILITY = 0.15
const REPLACEMENT_PROBABILITY = 0.15
const INVALID_DURATION_PROBABILITY = 0.05
const WAIT_PROBABILITY = 0.2

// The ladders cover a change in the number of rungs, equal neighbours, and ladders with one distinct rung.
const LADDERS: LadderRung[][] = [
	L1,
	L2,
	withRung(L1, NEW_TOP_BANDWIDTH),
	withoutRung(L1, 0),
	rungs(L1[0].bandwidth, L1[1].bandwidth, L1[1].bandwidth, L1[2].bandwidth),
	rungs(ONE_BANDWIDTH),
	rungs(ONE_BANDWIDTH, ONE_BANDWIDTH),
]
const BUFFER_TARGETS = [
	BOLA_DEFAULT_BUFFER_TARGET / 2,
	BOLA_DEFAULT_BUFFER_TARGET,
	BOLA_DEFAULT_BUFFER_TARGET * 2,
]
const STARVATION_SAFETY_FACTORS = [
	DEFAULT_STARVATION_SAFETY_FACTOR / 2,
	DEFAULT_STARVATION_SAFETY_FACTOR,
	1,
]
const KNOWN_STATES: string[] = Object.values(BolaState)

type Random = () => number

function pick<T>(random: Random, values: readonly T[]): T {
	return values[Math.floor(random() * values.length)]
}

// Checks what every decision promises, whatever the events before it were.
function checkDecision(
	decision: BolaDecision,
	ladder: readonly LadderRung[],
	context: string,
): void {
	ok(
		Number.isInteger(decision.index) && decision.index >= 0 && decision.index < ladder.length,
		`${context}: index ${decision.index} is in the ladder`,
	)
	ok(
		Number.isFinite(decision.delay) && decision.delay >= 0,
		`${context}: delay ${decision.delay} is finite and not negative`,
	)
	ok(
		Number.isFinite(decision.placeholder) && decision.placeholder >= 0,
		`${context}: placeholder ${decision.placeholder} is finite and not negative`,
	)
	ok(KNOWN_STATES.includes(decision.state), `${context}: state ${decision.state} is known`)

	if (decision.delay > 0) {
		equal(decision.state, BolaState.STEADY, `${context}: only the steady state delays`)
		ok(decision.index < ladder.length - 1, `${context}: the top rung never delays`)
	}
}

function isPositiveNumber(value: number | undefined): value is number {
	return Number.isFinite(value) && (value as number) > 0
}

// When the starvation guard ran, the pick is the lowest rung, or its download fits in the real buffer.
function checkStarvationGuard(
	decision: BolaDecision,
	ladder: readonly LadderRung[],
	input: BitrateSelectorInput,
	segmentDuration: number,
	starvationSafetyFactor: number,
	context: string,
): void {
	const bufferLevel = isPositiveNumber(input.bufferLevel) ? input.bufferLevel : 0
	const playbackRate = isPositiveNumber(input.playbackRate) ? input.playbackRate : 1
	const bandwidth = ladder[decision.index].bandwidth
	const downloadSeconds =
		(bandwidth * segmentDuration) / (input.throughput * starvationSafetyFactor)

	ok(
		bandwidth === ladder[0].bandwidth || downloadSeconds <= bufferLevel / playbackRate,
		`${context}: the guard left rung ${decision.index}, which downloads in ${downloadSeconds} s`,
	)
}

// Plays one random sequence of player events against a selector. The player calls select and then reports the download.
// The events include aborts, replacement segments, a change of the ladder or the buffer target, a stall, and a reset.
function playSequence(seed: number): void {
	const random = createSeededRandom(seed)
	const starvationSafetyFactor = pick(random, STARVATION_SAFETY_FACTORS)
	const selector: BolaSelector = createBolaSelector({ starvationSafetyFactor })
	const usesBufferTarget = random() < BUFFER_TARGET_USE_PROBABILITY

	let ladder = pick(random, LADDERS)
	let bufferTarget = pick(random, BUFFER_TARGETS)
	let bufferLevel = random() * MAXIMUM_BUFFER_LEVEL
	let clock = 0
	// What the test needs to know about the state of the selector. A change to or from one distinct rung restarts the selector.
	let finishedSamples = 0
	let previousState: BolaState = BolaState.STARTUP
	let previousDistinctCount = 0

	for (let event = 0; event < EVENTS_PER_SEQUENCE; event++) {
		const context = `seed ${seed}, event ${event}`

		if (random() < RESET_PROBABILITY) {
			selector.reset()
			finishedSamples = 0
			previousState = BolaState.STARTUP
		}

		if (random() < LADDER_CHANGE_PROBABILITY) {
			ladder = pick(random, LADDERS)
		}

		if (random() < TARGET_CHANGE_PROBABILITY) {
			bufferTarget = pick(random, BUFFER_TARGETS)
		}

		bufferLevel =
			random() < STALL_PROBABILITY
				? 0
				: Math.min(
						MAXIMUM_BUFFER_LEVEL,
						Math.max(0, bufferLevel + (random() - 0.5) * BUFFER_STEP_SPREAD),
					)

		const input: BitrateSelectorInput = {
			ladder,
			bufferLevel: random() < INVALID_BUFFER_LEVEL_PROBABILITY ? NaN : bufferLevel,
			throughput: random() < UNKNOWN_THROUGHPUT_PROBABILITY ? NaN : random() * MAXIMUM_THROUGHPUT,
			now: clock,
			bufferTarget: usesBufferTarget ? bufferTarget : undefined,
			segmentDuration: random() < SEGMENT_DURATION_PASS_PROBABILITY ? SEGMENT_DURATION : undefined,
			playbackRate:
				random() < PLAYBACK_RATE_PASS_PROBABILITY
					? MINIMUM_PLAYBACK_RATE + random() * PLAYBACK_RATE_SPREAD
					: undefined,
		}
		const decision = selector.select(input)
		const distinctCount = new Set(ladder.map(rung => rung.bandwidth)).size

		checkDecision(decision, ladder, context)

		const isGuardActive =
			previousState === BolaState.STEADY &&
			previousDistinctCount > 1 &&
			distinctCount > 1 &&
			finishedSamples >= FINISHED_SAMPLES_FOR_GUARD &&
			Number.isFinite(input.throughput)

		if (isGuardActive && isPositiveNumber(input.segmentDuration)) {
			checkStarvationGuard(
				decision,
				ladder,
				input,
				input.segmentDuration,
				starvationSafetyFactor,
				context,
			)
		}

		previousState = decision.state
		previousDistinctCount = distinctCount

		clock += decision.delay * MILLISECONDS_PER_SECOND

		if (random() < WAIT_PROBABILITY) {
			clock += random() * MAXIMUM_WAIT
		}

		const requestDuration = MINIMUM_REQUEST_DURATION + random() * REQUEST_DURATION_SPREAD
		const sample: SegmentSample = {
			timing: { startTime: clock, encodedBodySize: 1, duration: requestDuration },
			bandwidth: ladder[decision.index].bandwidth,
			duration: random() < INVALID_DURATION_PROBABILITY ? NaN : SEGMENT_DURATION,
			bufferLevel,
			isReplacement: random() < REPLACEMENT_PROBABILITY,
			aborted: random() < ABORT_PROBABILITY,
		}

		clock += requestDuration
		selector.sample(sample)

		if (!sample.aborted) {
			finishedSamples++
		}
	}
}

describe('createBolaSelector with random events', () => {
	it('keeps every decision valid across aborts, replacements, ladder changes, stalls, and resets', () => {
		for (let seed = 1; seed <= SEQUENCE_COUNT; seed++) {
			playSequence(seed)
		}
	})
})
