import type { BitrateDecision, BitrateSelector, LadderRung, SegmentSample } from '@svta/cml-abr'
import { createSeededRandom } from './seededRandom.ts'
import { BITS_PER_BYTE, MILLISECONDS_PER_SECOND } from './units.ts'

const TRACE_SECONDS = 4000
const FAST_HALF_LIFE = 3
const SLOW_HALF_LIFE = 9
const MINIMUM_PIECE_SECONDS = 2
const PIECE_SECONDS_SPREAD = 4
const WALK_VOLATILITY = 0.3

/**
 * A piece of a throughput trace. The throughput is `bandwidth` bits per second until `end` seconds.
 */
type TracePiece = { end: number, bandwidth: number }

type ThroughputTrace = readonly TracePiece[]

type SimulationOptions = {
	ladder: readonly LadderRung[]
	trace: ThroughputTrace
	/** The buffer size of the player in seconds. The player passes it as the buffer target. */
	bufferCap: number
	segmentCount: number
	/** The media duration of each segment in seconds. */
	segmentDuration: number
	/** When true, the player does not pass `segmentDuration` to `select`, so a selector skips its starvation guard. */
	omitSegmentDuration?: boolean
}

export type SimulationResult = {
	/** The bandwidth of the rung that each segment used. */
	bandwidths: number[]
	/** The delay of the first decision of each segment, in seconds. */
	delays: number[]
	/** The decisions after a wait that still had a delay. The contract expects none. */
	repeatedDelays: number
	/** The downloads that ended after the buffer was empty. */
	stallCount: number
}

/**
 * Creates a trace with a constant throughput.
 */
export function createConstantTrace(bandwidth: number): ThroughputTrace {
	return [{ end: TRACE_SECONDS, bandwidth }]
}

/**
 * Creates a deterministic trace in which the throughput follows a random walk between `minimum` and `maximum` bits per second.
 */
export function createRandomWalkTrace(seed: number, minimum: number, maximum: number): ThroughputTrace {
	const random = createSeededRandom(seed)
	const pieces: TracePiece[] = []
	let end = 0
	let bandwidth = Math.sqrt(minimum * maximum)

	while (end < TRACE_SECONDS) {
		end += MINIMUM_PIECE_SECONDS + random() * PIECE_SECONDS_SPREAD
		bandwidth = Math.min(maximum, Math.max(minimum, bandwidth * Math.exp(WALK_VOLATILITY * normal(random))))
		pieces.push({ end, bandwidth })
	}

	return pieces
}

function normal(random: () => number): number {
	return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
}

// Returns the seconds that a download of `bits` takes when it starts at `start` seconds.
function downloadSeconds(trace: ThroughputTrace, start: number, bits: number): number {
	let time = start
	let remaining = bits

	for (const piece of trace) {
		if (piece.end <= time) {
			continue
		}

		const capacity = (piece.end - time) * piece.bandwidth

		if (capacity >= remaining) {
			return time + remaining / piece.bandwidth - start
		}

		remaining -= capacity
		time = piece.end
	}

	throw new RangeError('The trace ended before the download finished')
}

type Ewma = { alpha: number, estimate: number, duration: number }

function createEwma(halfLife: number): Ewma {
	return { alpha: Math.pow(0.5, 1 / halfLife), estimate: 0, duration: 0 }
}

function addToEwma(ewma: Ewma, duration: number, value: number): void {
	const weight = 1 - Math.pow(ewma.alpha, duration)

	ewma.estimate = weight * value + (1 - weight) * ewma.estimate
	ewma.duration += duration
}

function readEwma(ewma: Ewma): number {
	return ewma.estimate / (1 - Math.pow(ewma.alpha, ewma.duration))
}

// The estimate is the smaller of two exponentially weighted averages.
// A local estimate keeps the tests of this package independent of `@svta/cml-throughput`.
function createThroughputEstimate(): { sample(seconds: number, bandwidth: number): void, get(): number } {
	const fast = createEwma(FAST_HALF_LIFE)
	const slow = createEwma(SLOW_HALF_LIFE)

	return {
		sample(seconds, bandwidth) {
			addToEwma(fast, seconds, bandwidth)
			addToEwma(slow, seconds, bandwidth)
		},

		get: () => (fast.duration === 0 ? NaN : Math.min(readEwma(fast), readEwma(slow))),
	}
}

/**
 * Plays a stream with a selector and reports what happened.
 * The player follows the contract of `BitrateSelector`.
 * It asks for a rung before each request. When the decision has a delay, it waits and asks again.
 * It samples every download.
 * The player starts to play after the first segment, and a stall is time with an empty buffer.
 */
export function simulatePlayback(selector: BitrateSelector, options: SimulationOptions): SimulationResult {
	const { ladder, trace, bufferCap, segmentCount, segmentDuration, omitSegmentDuration } = options
	const estimate = createThroughputEstimate()
	const result: SimulationResult = { bandwidths: [], delays: [], repeatedDelays: 0, stallCount: 0 }

	let time = 0
	let buffer = 0
	let isPlaying = false

	// Moves the clock. A playing buffer drains while the clock moves.
	function advance(seconds: number): void {
		time += seconds
		buffer = isPlaying ? Math.max(0, buffer - seconds) : buffer
	}

	function select(): BitrateDecision {
		return selector.select({ ladder, bufferLevel: buffer, throughput: estimate.get(), now: time * MILLISECONDS_PER_SECOND, bufferTarget: bufferCap, segmentDuration: omitSegmentDuration ? undefined : segmentDuration })
	}

	// Asks for a rung. A decision with a delay makes the player wait and ask again, as the contract says.
	function pickRung(): BitrateDecision {
		let decision = select()

		result.delays.push(decision.delay)

		if (decision.delay > 0) {
			advance(decision.delay)
			decision = select()

			if (decision.delay > 0) {
				result.repeatedDelays++
			}
		}

		return decision
	}

	// Downloads one segment, drains the buffer, and returns the sample for the selector.
	function download(bandwidth: number): SegmentSample {
		const bits = bandwidth * segmentDuration
		const seconds = downloadSeconds(trace, time, bits)
		const startTime = time * MILLISECONDS_PER_SECOND

		if (isPlaying) {
			if (seconds > buffer) {
				result.stallCount++
				buffer = 0
			} else {
				buffer -= seconds
			}
		}

		time += seconds

		const bufferLevel = buffer

		buffer += segmentDuration
		isPlaying = true
		estimate.sample(seconds, bits / seconds)

		return {
			timing: { startTime, encodedBodySize: bits / BITS_PER_BYTE, duration: seconds * MILLISECONDS_PER_SECOND },
			bandwidth,
			duration: segmentDuration,
			bufferLevel,
		}
	}

	for (let n = 0; n < segmentCount; n++) {
		if (isPlaying) {
			advance(Math.max(0, buffer + segmentDuration - bufferCap))
		}

		const { bandwidth } = ladder[pickRung().index]

		selector.sample(download(bandwidth))
		result.bandwidths.push(bandwidth)
	}

	return result
}
