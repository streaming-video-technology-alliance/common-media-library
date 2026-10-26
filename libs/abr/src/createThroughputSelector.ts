import { applyStarvationGuard } from './applyStarvationGuard.ts'
import { averageTimeToFirstByte } from './averageTimeToFirstByte.ts'
import type { BitrateDecision } from './BitrateDecision.ts'
import type { BitrateSelector } from './BitrateSelector.ts'
import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import { DEFAULT_SAFETY_FACTOR } from './DEFAULT_SAFETY_FACTOR.ts'
import { DEFAULT_STARVATION_TOLERANCE } from './DEFAULT_STARVATION_TOLERANCE.ts'
import { DEFAULT_UPGRADE_FACTOR } from './DEFAULT_UPGRADE_FACTOR.ts'
import { findRung } from './findRung.ts'
import { findSustainableRung } from './findSustainableRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import { recordTimeToFirstByte } from './recordTimeToFirstByte.ts'
import type { SegmentSample } from './SegmentSample.ts'
import type { ThroughputSelectorOptions } from './ThroughputSelectorOptions.ts'
import { validateFactor } from './validateFactor.ts'
import { validateLadder } from './validateLadder.ts'

/**
 * Creates a rate-based bitrate selector.
 *
 * The selector picks the highest rung whose download fits in one segment.
 * The download time of a rung is the time to first byte plus a transfer time.
 * The transfer time is one segment at `throughput * safetyFactor`.
 * The download fits when the download time is at most `segmentDuration / playbackRate`. Rung 0 is the pick when no rung fits.
 * Without `segmentDuration`, the pick is the highest rung at or below `throughput * safetyFactor / playbackRate`.
 * The time to first byte is the mean of the last four samples, from `responseStart - startTime` of their timing.
 * Two rules refine the pick:
 *
 * - Hysteresis. If the pick is above the current rung, the selector recomputes the pick with `throughput * upgradeFactor`.
 *   It returns the higher of the current rung and that pick.
 * - Starvation guard. When the input has a positive `segmentDuration`, the first pass keeps the highest rung,
 *   at or below the pick, that downloads within `bufferLevel / playbackRate`.
 *   The guard uses the same download time with `throughput * safetyFactor`.
 *   If no rung passes, the second pass allows `min(segmentDuration, starvationTolerance)` more.
 *   Rung 0 passes the second pass in every case.
 *
 * The current rung is the bandwidth of the last sample that was not aborted, mapped to the highest rung at or below it
 * in the ladder of the call. When the throughput is unknown, the selector returns the current rung, or rung 0 before
 * the first sample. The delay is always 0. The selector keeps no clock and accepts a `select` call during a download.
 * The current rung is then the rung of the last sample.
 *
 * @example
 * {@includeCode ../test/createThroughputSelector.test.ts#example}
 *
 * @param options - The safety factor, the upgrade factor, the starvation tolerance, and whether to ignore the time to first byte
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
	const ignoreTimeToFirstByte = options?.ignoreTimeToFirstByte ?? false

	validateFactor('safetyFactor', safetyFactor)
	validateFactor('upgradeFactor', upgradeFactor)

	if (upgradeFactor > safetyFactor) {
		throw new RangeError(
			`Invalid upgradeFactor: expected a value at or below safetyFactor ${safetyFactor}, received ${upgradeFactor}`,
		)
	}

	if (!Number.isFinite(starvationTolerance) || starvationTolerance < 0) {
		throw new RangeError(
			`Invalid starvationTolerance: expected a finite number of 0 or more, received ${starvationTolerance}`,
		)
	}

	// The bandwidth, in bits per second, of the last sample that was not aborted. NaN before the first sample.
	let currentBandwidth = NaN
	// The time to first byte, in seconds, of the last four samples that were not aborted.
	const timeToFirstByteSamples: number[] = []

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
			const timeToFirstByte = averageTimeToFirstByte(timeToFirstByteSamples)

			let index = findSustainableRung(
				ladder,
				throughput * safetyFactor,
				playbackRate,
				segmentDuration,
				timeToFirstByte,
			)

			if (hasCurrent && index > current) {
				index = Math.max(
					current,
					findSustainableRung(
						ladder,
						throughput * upgradeFactor,
						playbackRate,
						segmentDuration,
						timeToFirstByte,
					),
				)
			}

			if (isPositiveFinite(segmentDuration)) {
				const budget = bufferLevel / playbackRate
				const tolerance = Math.min(segmentDuration, starvationTolerance)

				index = applyStarvationGuard(
					ladder,
					index,
					segmentDuration,
					throughput * safetyFactor,
					timeToFirstByte,
					budget,
					tolerance,
				)
			}

			return { index, delay: 0 }
		},

		sample(segment: SegmentSample): void {
			if (segment.aborted || !Number.isFinite(segment.bandwidth)) {
				return
			}

			currentBandwidth = segment.bandwidth

			if (!ignoreTimeToFirstByte) {
				recordTimeToFirstByte(timeToFirstByteSamples, segment.timing)
			}
		},

		reset(): void {
			currentBandwidth = NaN
			timeToFirstByteSamples.length = 0
		},
	}
}
