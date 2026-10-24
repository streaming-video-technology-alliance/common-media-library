// Derived from dash.js BolaRule.js, Copyright (c) 2016, Dash Industry Forum, BSD-3-Clause. See NOTICE.md.

import { applyStarvationGuard } from './applyStarvationGuard.ts'
import { averageTimeToFirstByte } from './averageTimeToFirstByte.ts'
import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import { STALL_THRESHOLD, STARVATION_GUARD_SAMPLE_COUNT } from './BOLA_CONSTANTS.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from './BOLA_DEFAULT_BUFFER_TARGET.ts'
import type { BolaDecision } from './BolaDecision.ts'
import type { BolaParams } from './BolaParams.ts'
import type { BolaSelector } from './BolaSelector.ts'
import type { BolaSelectorOptions } from './BolaSelectorOptions.ts'
import { BolaState } from './BolaState.ts'
import { computeDelay } from './computeDelay.ts'
import { createBolaParams } from './createBolaParams.ts'
import { DEFAULT_SAFETY_FACTOR } from './DEFAULT_SAFETY_FACTOR.ts'
import { DEFAULT_STARVATION_SAFETY_FACTOR } from './DEFAULT_STARVATION_SAFETY_FACTOR.ts'
import { findRung } from './findRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import { isSameLadder } from './isSameLadder.ts'
import type { LadderRung } from './LadderRung.ts'
import { limitUpwardSwitch } from './limitUpwardSwitch.ts'
import { MILLISECONDS_PER_SECOND } from './MILLISECONDS_PER_SECOND.ts'
import { placeholderAfterAbort } from './placeholderAfterAbort.ts'
import { placeholderAfterSample } from './placeholderAfterSample.ts'
import { recordTimeToFirstByte } from './recordTimeToFirstByte.ts'
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
 *   It sets the placeholder so that the effective buffer is at least the threshold of that rung.
 *   It moves to the steady state in the first call after a sample, when the buffer holds one segment.
 *   That call still picks from the throughput.
 * - Steady. The selector picks the rung for the effective buffer and applies two guards.
 *   The oscillation guard limits an upward switch. Suppose the buffer picks a rung above the current rung
 *   and above the rung that the throughput sustains. Then the guard keeps the higher of those two rungs.
 *   The starvation guard lowers the pick when the download of the next segment does not fit in the real buffer.
 *
 * A call returns a delay when the effective buffer is above the maximum buffer of the chosen rung.
 * The placeholder absorbs part of the excess first, and the remainder is the delay. The top rung never has a delay.
 * The player waits and calls `select` again. When the buffer drained during the wait, the second call returns a delay of 0.
 * A call in which the starvation guard lowers the pick returns no delay.
 * In the steady state, a `bufferLevel` of 0.3 seconds or less counts as a stall and clears the placeholder.
 * When the ladder or the buffer target changes, the selector converts the placeholder to keep the pick equivalent.
 * A placeholder cannot be negative, so the conversion has a limit. The README states it.
 * After an aborted download, the next lower rung replaces the aborted rung.
 * The replacement becomes the current rung, and its threshold caps the effective buffer.
 *
 * The starvation guard runs when the input has a positive `segmentDuration` and the throughput is known.
 * It waits until two samples have finished since the last reset.
 * It keeps the highest rung, at or below the pick, that downloads within `bufferLevel / playbackRate`.
 * It assumes `throughput * starvationSafetyFactor` for that download.
 * It adds the mean time to first byte of the last four finished samples to that download. Rung 0 always passes.
 * A player omits `segmentDuration` to skip the guard, for example near the live edge.
 *
 * The selector reads `timing`, `bandwidth`, `duration`, `bufferLevel`, `isReplacement`, and `aborted` from a sample.
 * A sample without a positive finite `duration` keeps the selector in the startup state.
 * The selector needs the throughput estimate at startup and in both guards.
 * It reads `segmentDuration` and `playbackRate` for the starvation guard only.
 *
 * BOLA suits a large buffer. In the dash.js follow-up paper, a throughput rule oscillates less than the original BOLA
 * with a buffer of 10 seconds. The original BOLA has no placeholder buffer and no starvation guard.
 * A small `bufferTarget` needs care.
 *
 * @example
 * {@includeCode ../test/createBolaSelector.test.ts#example}
 *
 * @param options - The safety factor, the starvation safety factor, and whether to ignore the time to first byte
 * @returns The selector
 * @throws RangeError when `safetyFactor` or `starvationSafetyFactor` is not a finite number above 0 and at most 1
 *
 * @see {@link https://arxiv.org/abs/1601.06748 | BOLA: Near-Optimal Bitrate Adaptation for Online Videos}
 * @see {@link https://doi.org/10.1145/3204949.3204953 | From Theory to Practice: Improving Bitrate Adaptation in the DASH Reference Player}
 * @see {@link https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/BolaRule.js | dash.js BolaRule}
 * @see {@link https://github.com/Dash-Industry-Forum/dash.js/blob/ac9e3d18818f3ba9b99a87151b887d66aed12c56/src/streaming/rules/abr/InsufficientBufferRule.js | dash.js InsufficientBufferRule}
 *
 * @beta
 */
export function createBolaSelector(options?: BolaSelectorOptions): BolaSelector {
	const safetyFactor = options?.safetyFactor ?? DEFAULT_SAFETY_FACTOR
	const starvationSafetyFactor = options?.starvationSafetyFactor ?? DEFAULT_STARVATION_SAFETY_FACTOR
	const ignoreTimeToFirstByte = options?.ignoreTimeToFirstByte ?? false

	validateFactor('safetyFactor', safetyFactor)
	validateFactor('starvationSafetyFactor', starvationSafetyFactor)

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
	// The number of finished samples since the last reset. It stops at `STARVATION_GUARD_SAMPLE_COUNT`, the number that the starvation guard waits for.
	let finishedSampleCount = 0
	// The time to first byte, in seconds, of the last four finished samples.
	const timeToFirstByteSamples: number[] = []
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
		finishedSampleCount = 0
		timeToFirstByteSamples.length = 0
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
		bandwidths = ladder.map(rung => rung.bandwidth)
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

	function selectInStartup(
		rungParams: BolaParams,
		bufferLevel: number,
		safeThroughput: number,
	): BolaDecision {
		const position = Number.isNaN(safeThroughput) ? 0 : findRung(rungParams.rungs, safeThroughput)

		placeholder = Math.max(0, rungParams.thresholds[position] - bufferLevel)

		if (Number.isFinite(lastSegmentDuration) && bufferLevel >= lastSegmentDuration) {
			state = BolaState.STEADY
		}

		return commitDecision(rungParams, position, 0)
	}

	// The conversion of a rebuild needs the elapsed time in the placeholder, so the call adds the time first.
	function selectInSteadyState(
		input: BitrateSelectorInput,
		rungParams: BolaParams,
		previousParams: BolaParams | undefined,
		bufferLevel: number,
		throughput: number,
	): BolaDecision {
		consumeElapsedTime(input.now)

		if (previousParams && previousParams !== rungParams) {
			convertPlaceholder(previousParams, rungParams, bufferLevel)
		}

		if (bufferLevel <= STALL_THRESHOLD) {
			emptyPlaceholder()
		}

		const effectiveBuffer = bufferLevel + placeholder
		const pick = pickByBuffer(rungParams, effectiveBuffer, throughput)
		const position = limitStarvation(rungParams, pick, input, bufferLevel, throughput)

		// The guard found the real buffer too short for the download of the pick. A wait would drain the buffer more.
		if (position < pick) {
			return commitDecision(rungParams, position, 0)
		}

		const excess = Math.max(0, effectiveBuffer - rungParams.maximumBuffers[position])
		const isTopRung = position === rungParams.rungs.length - 1
		const delay = isTopRung ? 0 : computeDelay(excess, placeholder)

		// The placeholder absorbs the excess before the player waits.
		placeholder = Math.max(0, placeholder - excess)

		return commitDecision(rungParams, position, delay)
	}

	// The rung with the best score for the effective buffer, limited by the oscillation guard when the throughput is known.
	function pickByBuffer(
		rungParams: BolaParams,
		effectiveBuffer: number,
		throughput: number,
	): number {
		const position = selectRungByBuffer(rungParams, effectiveBuffer)

		if (Number.isNaN(throughput)) {
			return position
		}

		return limitUpwardSwitch(
			position,
			currentPosition(rungParams),
			findRung(rungParams.rungs, throughput * safetyFactor),
		)
	}

	// The starvation guard has one pass, and rung 0 is its fallback. It needs a positive `segmentDuration`, a known throughput, and enough finished samples.
	function limitStarvation(
		rungParams: BolaParams,
		position: number,
		input: BitrateSelectorInput,
		bufferLevel: number,
		throughput: number,
	): number {
		if (
			finishedSampleCount < STARVATION_GUARD_SAMPLE_COUNT ||
			Number.isNaN(throughput) ||
			!isPositiveFinite(input.segmentDuration)
		) {
			return position
		}

		const playbackRate = isPositiveFinite(input.playbackRate) ? input.playbackRate : 1

		return applyStarvationGuard(
			rungParams.rungs,
			position,
			input.segmentDuration,
			throughput * starvationSafetyFactor,
			averageTimeToFirstByte(timeToFirstByteSamples),
			bufferLevel / playbackRate,
			NO_TOLERANCE,
		)
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

	// The next lower rung replaces the aborted rung. The replacement becomes the current rung, and it caps the placeholder.
	// The lowest rung has no lower rung, so it stays the current rung.
	function recordAbortedSample(segment: SegmentSample, bufferLevel: number): void {
		if (params && params.rungs.length > 1) {
			const replacementPosition = Math.max(0, findRung(params.rungs, segment.bandwidth) - 1)

			currentBandwidth = params.rungs[replacementPosition].bandwidth
			placeholder = placeholderAfterAbort(params, replacementPosition, placeholder, bufferLevel)
		}

		endRequest(segment, bufferLevel)
	}

	function recordFinishedSample(segment: SegmentSample, bufferLevel: number): void {
		currentBandwidth = segment.bandwidth
		finishedSampleCount = Math.min(finishedSampleCount + 1, STARVATION_GUARD_SAMPLE_COUNT)

		if (!ignoreTimeToFirstByte) {
			recordTimeToFirstByte(timeToFirstByteSamples, segment.timing)
		}

		if (isPositiveFinite(segment.duration)) {
			lastSegmentDuration = segment.duration
		}

		if (params && params.rungs.length > 1) {
			placeholder = placeholderAfterSample(params, placeholder, segment, bufferLevel)
		}

		endRequest(segment, bufferLevel)
	}

	// A stall empties the placeholder and the time bases. Otherwise the end of the request starts the clock of the placeholder.
	// An aborted request ends at the abort, so its clock skips the download time too.
	function endRequest(segment: SegmentSample, bufferLevel: number): void {
		if (state === BolaState.STEADY && bufferLevel <= STALL_THRESHOLD) {
			emptyPlaceholder()
		} else {
			lastRequestEnd = getRequestEnd(segment)
		}
	}

	return {
		select(input: BitrateSelectorInput): BolaDecision {
			const target = input.bufferTarget ?? BOLA_DEFAULT_BUFFER_TARGET
			const bufferLevel = isPositiveFinite(input.bufferLevel) ? input.bufferLevel : 0
			const previousParams = params
			const rungParams = syncParams(input.ladder, target)

			if (rungParams.rungs.length === 1) {
				return {
					index: rungParams.positions[0],
					delay: 0,
					state: BolaState.STARTUP,
					placeholder: 0,
				}
			}

			// NaN stands for an unknown throughput. A throughput of 0 is a measurement.
			const throughput =
				Number.isFinite(input.throughput) && input.throughput >= 0 ? input.throughput : NaN

			return state === BolaState.STARTUP
				? selectInStartup(rungParams, bufferLevel, throughput * safetyFactor)
				: selectInSteadyState(input, rungParams, previousParams, bufferLevel, throughput)
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

// The seconds that the second pass of the starvation guard adds to the budget. The BOLA guard has one pass.
const NO_TOLERANCE = 0

// The end of the request, in milliseconds on the clock of `now`.
function getRequestEnd(segment: SegmentSample): number {
	return segment.timing.startTime + segment.timing.duration
}
