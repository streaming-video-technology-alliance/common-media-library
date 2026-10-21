import { applyStarvationGuard } from './applyStarvationGuard.ts'
import type { BitrateDecision } from './BitrateDecision.ts'
import type { BitrateSelector } from './BitrateSelector.ts'
import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import { DEFAULT_SAFETY_FACTOR } from './DEFAULT_SAFETY_FACTOR.ts'
import { DEFAULT_STARVATION_TOLERANCE } from './DEFAULT_STARVATION_TOLERANCE.ts'
import { DEFAULT_UPGRADE_FACTOR } from './DEFAULT_UPGRADE_FACTOR.ts'
import { findRung } from './findRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import type { SegmentSample } from './SegmentSample.ts'
import type { ThroughputSelectorOptions } from './ThroughputSelectorOptions.ts'
import { validateFactor } from './validateFactor.ts'
import { validateLadder } from './validateLadder.ts'

/**
 * Creates a rate-based bitrate selector.
 *
 * The selector divides the throughput by the playback rate to get the effective throughput.
 * It picks the highest rung at or below `effectiveThroughput * safetyFactor`, or rung 0 when no rung fits.
 * Two rules refine the pick:
 *
 * - Hysteresis. If the pick is above the current rung, the selector recomputes the pick with `upgradeFactor`
 *   and returns the higher of the current rung and that pick.
 * - Starvation guard. When the input has a positive `segmentDuration`, the first pass keeps the highest rung,
 *   at or below the pick, that downloads within `bufferLevel / playbackRate`. If no rung passes, the second pass
 *   allows `min(segmentDuration, starvationTolerance)` more. Rung 0 passes the second pass in every case.
 *
 * The current rung is the bandwidth of the last sample that was not aborted, mapped to the highest rung at or below it
 * in the ladder of the call. When the throughput is unknown, the selector returns the current rung, or rung 0 before
 * the first sample. The delay is always 0.
 *
 * @example
 * {@includeCode ../test/createThroughputSelector.test.ts#example}
 *
 * @param options - The safety factor, the upgrade factor, and the starvation tolerance
 * @returns The selector
 * @throws RangeError when a factor is not a finite number above 0 and at most 1, when `upgradeFactor` exceeds
 * `safetyFactor`, or when `starvationTolerance` is not a finite number of 0 or more
 *
 * @beta
 */
export function createThroughputSelector(options?: ThroughputSelectorOptions): BitrateSelector {
	const safetyFactor = options?.safetyFactor ?? DEFAULT_SAFETY_FACTOR
	const upgradeFactor = options?.upgradeFactor ?? DEFAULT_UPGRADE_FACTOR
	const starvationTolerance = options?.starvationTolerance ?? DEFAULT_STARVATION_TOLERANCE

	validateFactor('safetyFactor', safetyFactor)
	validateFactor('upgradeFactor', upgradeFactor)

	if (upgradeFactor > safetyFactor) {
		throw new RangeError(`Invalid upgradeFactor: expected a value at or below safetyFactor ${safetyFactor}, received ${upgradeFactor}`)
	}

	if (!Number.isFinite(starvationTolerance) || starvationTolerance < 0) {
		throw new RangeError(`Invalid starvationTolerance: expected a finite number of 0 or more, received ${starvationTolerance}`)
	}

	// The bandwidth, in bits per second, of the last sample that was not aborted. NaN before the first sample.
	let currentBandwidth = NaN

	return {
		select(input: BitrateSelectorInput): BitrateDecision {
			const { ladder, throughput, segmentDuration } = input

			validateLadder(ladder)

			const hasCurrent = Number.isFinite(currentBandwidth)
			const current = hasCurrent ? findRung(ladder, currentBandwidth) : 0

			if (!Number.isFinite(throughput) || throughput < 0) {
				return { index: current, delay: 0 }
			}

			const playbackRate = isPositiveFinite(input.playbackRate) ? input.playbackRate : 1
			const bufferLevel = isPositiveFinite(input.bufferLevel) ? input.bufferLevel : 0
			const effectiveThroughput = throughput / playbackRate

			let index = findRung(ladder, effectiveThroughput * safetyFactor)

			if (hasCurrent && index > current) {
				index = Math.max(current, findRung(ladder, effectiveThroughput * upgradeFactor))
			}

			if (isPositiveFinite(segmentDuration)) {
				const budget = bufferLevel / playbackRate
				const tolerance = Math.min(segmentDuration, starvationTolerance)

				index = applyStarvationGuard(ladder, index, segmentDuration, throughput * safetyFactor, budget, tolerance)
			}

			return { index, delay: 0 }
		},

		sample(segment: SegmentSample): void {
			if (segment.aborted || !Number.isFinite(segment.bandwidth)) {
				return
			}

			currentBandwidth = segment.bandwidth
		},

		reset(): void {
			currentBandwidth = NaN
		},
	}
}
