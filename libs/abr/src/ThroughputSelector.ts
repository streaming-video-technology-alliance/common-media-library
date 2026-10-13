import type { BitrateDecision } from './BitrateDecision.ts'
import type { BitrateSelector } from './BitrateSelector.ts'
import type { BitrateSelectorInput } from './BitrateSelectorInput.ts'
import { DEFAULT_SAFETY_FACTOR } from './DEFAULT_SAFETY_FACTOR.ts'
import { DEFAULT_UPGRADE_FACTOR } from './DEFAULT_UPGRADE_FACTOR.ts'
import { findRung } from './findRung.ts'
import type { SegmentSample } from './SegmentSample.ts'
import type { ThroughputSelectorOptions } from './ThroughputSelectorOptions.ts'
import { validateLadder } from './validateLadder.ts'

/**
 * Rate-based bitrate selector.
 *
 * The selector divides the throughput by the playback rate to get the effective throughput.
 * It picks the highest rung at or below `effectiveThroughput * safetyFactor`, or rung 0 when no rung fits.
 * Two rules refine the pick:
 *
 * - Hysteresis. If the pick is above the current rung, the selector recomputes the pick with `upgradeFactor`
 *   and returns the higher of the current rung and that pick.
 * - Starvation guard. When the input has a positive `segmentDuration` and a positive `bufferLevel`, the selector
 *   steps down one rung at a time until the estimated download time of the pick fits in the buffer.
 *
 * The current rung is the bitrate of the last sample that was not aborted, mapped to the highest rung at or below it
 * in the ladder of the call. When the throughput is unknown, the selector returns the current rung, or rung 0 before
 * the first sample. The delay is always 0.
 *
 * @example
 * {@includeCode ../test/ThroughputSelector.test.ts#example}
 *
 * @beta
 */
export class ThroughputSelector implements BitrateSelector {
	private safetyFactor: number
	private upgradeFactor: number
	// The bitrate, in bits per second, of the last sample that was not aborted. NaN before the first sample.
	private currentBitrate: number = NaN

	/**
	 * @param options - The safety factor and the upgrade factor
	 * @throws RangeError when a factor is not a finite number in (0, 1], or when `upgradeFactor` exceeds `safetyFactor`
	 */
	public constructor(options?: ThroughputSelectorOptions) {
		const safetyFactor = options?.safetyFactor ?? DEFAULT_SAFETY_FACTOR
		const upgradeFactor = options?.upgradeFactor ?? DEFAULT_UPGRADE_FACTOR

		validateFactor('safetyFactor', safetyFactor)
		validateFactor('upgradeFactor', upgradeFactor)

		if (upgradeFactor > safetyFactor) {
			throw new RangeError(`Invalid upgradeFactor: expected a value at or below safetyFactor ${safetyFactor}, received ${upgradeFactor}`)
		}

		this.safetyFactor = safetyFactor
		this.upgradeFactor = upgradeFactor
	}

	/**
	 * Chooses the rung of the next segment.
	 *
	 * @param input - The ladder, the buffer level, and the throughput estimate
	 * @returns The position of the chosen rung in `input.ladder`, and a delay of 0
	 * @throws RangeError when `input.ladder` is empty or not in ascending order
	 */
	public select(input: BitrateSelectorInput): BitrateDecision {
		const { ladder, throughput, segmentDuration } = input

		validateLadder(ladder)

		const hasCurrent = Number.isFinite(this.currentBitrate)
		const current = hasCurrent ? findRung(ladder, this.currentBitrate) : 0

		if (!isPositiveFinite(throughput)) {
			return { index: current, delay: 0 }
		}

		const playbackRate = isPositiveFinite(input.playbackRate) ? input.playbackRate : 1
		const bufferLevel = isPositiveFinite(input.bufferLevel) ? input.bufferLevel : 0
		const effectiveThroughput = throughput / playbackRate

		let index = findRung(ladder, effectiveThroughput * this.safetyFactor)

		if (hasCurrent && index > current) {
			index = Math.max(current, findRung(ladder, effectiveThroughput * this.upgradeFactor))
		}

		if (isPositiveFinite(segmentDuration) && bufferLevel > 0) {
			const safeThroughput = throughput * this.safetyFactor
			const budget = bufferLevel / playbackRate

			while (index > 0 && ladder[index] * segmentDuration / safeThroughput > budget) {
				index--
			}
		}

		return { index, delay: 0 }
	}

	/**
	 * Records a finished or abandoned download.
	 *
	 * The bitrate of the sample becomes the current rung.
	 * A sample with `aborted` set, or with a bitrate that is not a finite number, does not change the current rung.
	 *
	 * @param segment - The download
	 */
	public sample(segment: SegmentSample): void {
		if (segment.aborted || !Number.isFinite(segment.bitrate)) {
			return
		}

		this.currentBitrate = segment.bitrate
	}

	/**
	 * Clears the current rung.
	 */
	public reset(): void {
		this.currentBitrate = NaN
	}
}

function isPositiveFinite(value: number | undefined): value is number {
	return Number.isFinite(value) && (value as number) > 0
}

function validateFactor(name: string, value: number): void {
	if (!isPositiveFinite(value) || value > 1) {
		throw new RangeError(`Invalid ${name}: expected a finite number in (0, 1], received ${value}`)
	}
}
