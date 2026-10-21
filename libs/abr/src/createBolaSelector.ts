import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import { MILLISECONDS_PER_SECOND, STALL_THRESHOLD } from './BOLA_CONSTANTS.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from './BOLA_DEFAULT_BUFFER_TARGET.ts'
import type { BolaDecision } from './BolaDecision.ts'
import type { BolaParams } from './BolaParams.ts'
import type { BolaSelector } from './BolaSelector.ts'
import type { BolaSelectorOptions } from './BolaSelectorOptions.ts'
import { BolaState } from './BolaState.ts'
import { computeDelay } from './computeDelay.ts'
import { createBolaParams } from './createBolaParams.ts'
import { DEFAULT_SAFETY_FACTOR } from './DEFAULT_SAFETY_FACTOR.ts'
import { findRung } from './findRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import { isSameLadder } from './isSameLadder.ts'
import type { LadderRung } from './LadderRung.ts'
import { limitUpwardSwitch } from './limitUpwardSwitch.ts'
import { placeholderAfterAbort } from './placeholderAfterAbort.ts'
import { placeholderAfterSample } from './placeholderAfterSample.ts'
import { remapEffectiveBuffer } from './remapEffectiveBuffer.ts'
import type { SegmentSample } from './SegmentSample.ts'
import { selectRungByBuffer } from './selectRungByBuffer.ts'
import { validateBufferTarget } from './validateBufferTarget.ts'
import { validateFactor } from './validateFactor.ts'
import { validateLadder } from './validateLadder.ts'

/**
 * Creates a bitrate selector that implements BOLA, the Buffer Occupancy based Lyapunov Algorithm.
 *
 * BOLA scores each rung with the effective buffer. The effective buffer is the real buffer level plus a placeholder buffer.
 * A fuller buffer allows a higher rung. The selector has two states:
 *
 * - Startup. The selector picks the highest rung at or below `throughput * safetyFactor`.
 *   It sets the placeholder so that the effective buffer equals the threshold of that rung.
 *   It moves to the steady state in the first call after a sample, when the buffer holds one segment.
 *   That call still picks from the throughput.
 * - Steady. The selector picks the rung for the effective buffer and applies an oscillation guard.
 *   Suppose the buffer picks a rung above the current rung and above the rung that the throughput sustains.
 *   Then the guard keeps the higher of those two rungs.
 *
 * A call returns a delay when the effective buffer is above the maximum buffer of the chosen rung.
 * The placeholder absorbs part of the excess first, and the remainder is the delay. The top rung never has a delay.
 * The player waits and calls `select` again. When the buffer drained during the wait, the second call returns a delay of 0.
 * In the steady state, a `bufferLevel` of 0.3 seconds or less counts as a stall and clears the placeholder.
 * When the ladder or the buffer target changes, the selector converts the placeholder to keep the pick equivalent.
 * A placeholder cannot be negative, so the conversion has a limit. The README states it.
 *
 * The selector reads `timing`, `bandwidth`, `duration`, `bufferLevel`, `isReplacement`, and `aborted` from a sample.
 * A sample without a positive finite `duration` keeps the selector in the startup state.
 * The selector needs the throughput estimate at startup and for the guard only.
 * It ignores `segmentDuration` and `playbackRate`.
 *
 * BOLA suits a large buffer. The dash.js follow-up paper simulates a buffer of 10 seconds.
 * There, a throughput rule oscillates less than BOLA.
 *
 * @example
 * {@includeCode ../test/createBolaSelector.test.ts#example}
 *
 * @param options - The safety factor
 * @returns The selector
 * @throws RangeError when `safetyFactor` is not a finite number above 0 and at most 1
 *
 * @see {@link https://arxiv.org/abs/1601.06748 | BOLA: Near-Optimal Bitrate Adaptation for Online Videos}
 * @see {@link https://doi.org/10.1145/3204949.3204953 | From Theory to Practice: Improving Bitrate Adaptation in the DASH Reference Player}
 * @see {@link https://github.com/Dash-Industry-Forum/dash.js/blob/development/src/streaming/rules/abr/BolaRule.js | dash.js BolaRule}
 *
 * @beta
 */
export function createBolaSelector(options?: BolaSelectorOptions): BolaSelector {
	const safetyFactor = options?.safetyFactor ?? DEFAULT_SAFETY_FACTOR

	validateFactor('safetyFactor', safetyFactor)

	let state: BolaState = BolaState.STARTUP
	// The values that the selector derived from the ladder and the buffer target of the last rebuild. Undefined before the first call.
	let params: BolaParams | undefined
	// The bandwidths of the ladder of the last rebuild. The selector compares them with each new ladder.
	let bandwidths: number[] = []
	let bufferTarget = NaN
	// The placeholder buffer, in seconds.
	let placeholder = 0
	// The bandwidth, in bits per second, of the last rung that the selector picked or the player loaded. NaN before the first one.
	let currentBandwidth = NaN
	// The media duration, in seconds, of the last segment that the player did not abort. NaN before the first one.
	let lastSegmentDuration = NaN
	// The time bases of the wall-clock part of the placeholder, in milliseconds on the clock of `now`.
	// `lastRequestEnd` is the end of the last request. `lastCall` is the time of the last steady call. NaN when cleared.
	let lastRequestEnd = NaN
	let lastCall = NaN

	function reset(): void {
		state = BolaState.STARTUP
		params = undefined
		bandwidths = []
		bufferTarget = NaN
		placeholder = 0
		currentBandwidth = NaN
		lastSegmentDuration = NaN
		clearTimeBases()
	}

	function clearTimeBases(): void {
		lastRequestEnd = NaN
		lastCall = NaN
	}

	// Returns the values for the ladder and the buffer target of the call. It rebuilds them when either changed.
	// Validation runs only on a rebuild. It throws before the selector changes any state.
	function syncParams(ladder: readonly LadderRung[], target: number): BolaParams {
		if (params && bufferTarget === target && isSameLadder(ladder, bandwidths)) {
			return params
		}

		validateLadder(ladder)
		validateBufferTarget(target)

		const next = createBolaParams(ladder, target)

		if (params) {
			restartOnSingleRungChange(params, next)
		}

		params = next
		bandwidths = ladder.map((rung) => rung.bandwidth)
		bufferTarget = target

		return next
	}

	// A ladder that gains or loses its second distinct rung has no buffer-based decision to keep, so the selector restarts.
	function restartOnSingleRungChange(previous: BolaParams, next: BolaParams): void {
		if ((previous.rungs.length === 1) !== (next.rungs.length === 1)) {
			state = BolaState.STARTUP
			placeholder = 0
			lastSegmentDuration = NaN
		}
	}

	// Converts the placeholder to the values of a rebuild, so that the pick for the same situation stays the same.
	function convertPlaceholder(previous: BolaParams, next: BolaParams, bufferLevel: number): void {
		const effectiveBuffer = remapEffectiveBuffer(previous, next, bufferLevel + placeholder)

		placeholder = Math.max(0, effectiveBuffer - bufferLevel)
	}

	function currentPosition(rungParams: BolaParams): number {
		return Number.isFinite(currentBandwidth) ? findRung(rungParams.rungs, currentBandwidth) : 0
	}

	// Records the chosen rung as the current rung and returns the decision for it.
	function commitDecision(rungParams: BolaParams, position: number, delay: number): BolaDecision {
		currentBandwidth = rungParams.rungs[position].bandwidth

		return { index: rungParams.positions[position], delay, state, placeholder }
	}

	function selectInStartup(rungParams: BolaParams, bufferLevel: number, safeThroughput: number): BolaDecision {
		const position = Number.isNaN(safeThroughput) ? 0 : findRung(rungParams.rungs, safeThroughput)

		placeholder = Math.max(0, rungParams.thresholds[position] - bufferLevel)

		if (Number.isFinite(lastSegmentDuration) && bufferLevel >= lastSegmentDuration) {
			state = BolaState.STEADY
		}

		return commitDecision(rungParams, position, 0)
	}

	// The conversion of a rebuild needs the elapsed time in the placeholder, so the call adds the time first.
	function selectInSteadyState(rungParams: BolaParams, previousParams: BolaParams | undefined, bufferLevel: number, safeThroughput: number, now: number): BolaDecision {
		consumeElapsedTime(now)

		if (previousParams && previousParams !== rungParams) {
			convertPlaceholder(previousParams, rungParams, bufferLevel)
		}

		if (bufferLevel <= STALL_THRESHOLD) {
			emptyPlaceholder()
		}

		const effectiveBuffer = bufferLevel + placeholder
		let position = selectRungByBuffer(rungParams, effectiveBuffer)

		if (!Number.isNaN(safeThroughput)) {
			position = limitUpwardSwitch(position, currentPosition(rungParams), findRung(rungParams.rungs, safeThroughput))
		}

		const excess = Math.max(0, effectiveBuffer - rungParams.maximumBuffers[position])
		const isTopRung = position === rungParams.rungs.length - 1
		const delay = isTopRung ? 0 : computeDelay(excess, placeholder)

		// The placeholder absorbs the excess before the player waits.
		placeholder = Math.max(0, placeholder - excess)

		return commitDecision(rungParams, position, delay)
	}

	// A stall empties the placeholder and the time bases.
	function emptyPlaceholder(): void {
		placeholder = 0
		clearTimeBases()
	}

	// The placeholder grows with the time since the last request ended. When no request ended, it grows with the time since the last call.
	// A wait that the player causes then stays out of the decision. An example is a live segment that is not available yet.
	// The call also moves the time base to `now`.
	function consumeElapsedTime(now: number): void {
		if (!Number.isFinite(now)) {
			return
		}

		const base = Number.isFinite(lastRequestEnd) ? lastRequestEnd : lastCall

		if (Number.isFinite(base)) {
			placeholder += Math.max(0, now - base) / MILLISECONDS_PER_SECOND
		}

		lastRequestEnd = NaN
		lastCall = now
	}

	// An aborted download caps the placeholder. It does not change the current rung.
	// The abort ends the request, so the clock of the placeholder starts at the abort and skips the download time.
	function recordAbortedSample(segment: SegmentSample, bufferLevel: number): void {
		if (params && params.rungs.length > 1) {
			placeholder = placeholderAfterAbort(params, currentPosition(params), placeholder, bufferLevel)
		}

		lastRequestEnd = getRequestEnd(segment)
	}

	function recordFinishedSample(segment: SegmentSample, bufferLevel: number): void {
		currentBandwidth = segment.bandwidth

		if (isPositiveFinite(segment.duration)) {
			lastSegmentDuration = segment.duration
		}

		if (state === BolaState.STEADY && bufferLevel <= STALL_THRESHOLD) {
			emptyPlaceholder()

			return
		}

		if (params && params.rungs.length > 1) {
			placeholder = placeholderAfterSample(params, placeholder, segment, bufferLevel)
		}

		lastRequestEnd = getRequestEnd(segment)
	}

	return {
		select(input: BitrateSelectorInput): BolaDecision {
			const target = input.bufferTarget ?? BOLA_DEFAULT_BUFFER_TARGET
			const bufferLevel = isPositiveFinite(input.bufferLevel) ? input.bufferLevel : 0
			const previousParams = params
			const rungParams = syncParams(input.ladder, target)

			if (rungParams.rungs.length === 1) {
				return { index: rungParams.positions[0], delay: 0, state: BolaState.STARTUP, placeholder: 0 }
			}

			// NaN stands for an unknown throughput. A throughput of 0 is a measurement.
			const isKnown = Number.isFinite(input.throughput) && input.throughput >= 0
			const safeThroughput = isKnown ? input.throughput * safetyFactor : NaN

			return state === BolaState.STARTUP
				? selectInStartup(rungParams, bufferLevel, safeThroughput)
				: selectInSteadyState(rungParams, previousParams, bufferLevel, safeThroughput, input.now)
		},

		sample(segment: SegmentSample): void {
			if (!Number.isFinite(segment.bandwidth)) {
				return
			}

			const bufferLevel = isPositiveFinite(segment.bufferLevel) ? segment.bufferLevel : 0

			if (segment.aborted) {
				recordAbortedSample(segment, bufferLevel)
			} else {
				recordFinishedSample(segment, bufferLevel)
			}
		},

		reset,
	}
}

// The end of the request, in milliseconds on the clock of `now`.
function getRequestEnd(segment: SegmentSample): number {
	return segment.timing.startTime + segment.timing.duration
}
