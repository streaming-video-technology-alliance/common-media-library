import type { BitrateSelector } from '@svta/cml-abr'
import { DEFAULT_SAFETY_FACTOR, DEFAULT_UPGRADE_FACTOR, ThroughputSelector } from '@svta/cml-abr'
import { deepEqual, equal, throws } from 'node:assert'
import { describe, it } from 'node:test'

const ladder = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000]

// Records a 4 second segment of `bitrate` as the current rung of `selector`.
function load(selector: BitrateSelector, bitrate: number, aborted?: boolean): void {
	selector.sample({
		timing: { startTime: 0, encodedBodySize: bitrate / 2, duration: 500 },
		bitrate,
		duration: 4,
		bufferLevel: 4,
		aborted,
	})
}

describe('ThroughputSelector', () => {
	describe('constructor', () => {
		it('exports the default factors', () => {
			equal(DEFAULT_SAFETY_FACTOR, 0.9)
			equal(DEFAULT_UPGRADE_FACTOR, 0.7)
		})

		it('throws when safetyFactor is not a finite number in (0, 1]', () => {
			for (const safetyFactor of [0, -0.5, 1.5, NaN, Infinity]) {
				throws(() => new ThroughputSelector({ safetyFactor }), {
					name: 'RangeError',
					message: `Invalid safetyFactor: expected a finite number in (0, 1], received ${safetyFactor}`,
				})
			}
		})

		it('throws when upgradeFactor is not a finite number in (0, 1]', () => {
			for (const upgradeFactor of [0, -0.5, 1.5, NaN, Infinity]) {
				throws(() => new ThroughputSelector({ upgradeFactor }), {
					name: 'RangeError',
					message: `Invalid upgradeFactor: expected a finite number in (0, 1], received ${upgradeFactor}`,
				})
			}
		})

		it('throws when upgradeFactor is above safetyFactor', () => {
			throws(() => new ThroughputSelector({ safetyFactor: 0.8, upgradeFactor: 0.9 }), {
				name: 'RangeError',
				message: 'Invalid upgradeFactor: expected a value at or below safetyFactor 0.8, received 0.9',
			})
		})

		it('accepts equal factors and disables the hysteresis', () => {
			const selector = new ThroughputSelector({ safetyFactor: 0.9, upgradeFactor: 0.9 })
			load(selector, 750_000)

			// 0.9 * 1.7 Mbps is 1.53 Mbps, so the upgrade to 1.5 Mbps needs no extra margin.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 1_700_000, now: 0 }).index, 2)
		})
	})

	describe('select', () => {
		it('picks the highest rung at or below the safe throughput', () => {
			//#region example
			const selector = new ThroughputSelector()
			const ladder = [300_000, 750_000, 1_500_000, 3_000_000, 6_000_000]

			const { index } = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 })

			// The highest rung at or below 0.9 * 3 Mbps is 1.5 Mbps.
			equal(index, 2)
			//#endregion example
		})

		it('returns a delay of 0', () => {
			const selector = new ThroughputSelector()

			deepEqual(selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 }), { index: 2, delay: 0 })
		})

		it('picks rung 0 when no rung fits', () => {
			const selector = new ThroughputSelector()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 200_000, now: 0 }).index, 0)
		})

		it('picks the top rung when every rung fits', () => {
			const selector = new ThroughputSelector()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 100_000_000, now: 0 }).index, 4)
		})

		it('throws when the ladder is empty', () => {
			const selector = new ThroughputSelector()

			throws(() => selector.select({ ladder: [], bufferLevel: 4, throughput: 3_000_000, now: 0 }), {
				name: 'RangeError',
				message: 'Invalid ladder: expected at least one rung, received an empty array',
			})
		})

		it('throws when the ladder is not in ascending order', () => {
			const selector = new ThroughputSelector()

			throws(() => selector.select({ ladder: [300_000, 1_500_000, 750_000], bufferLevel: 4, throughput: 3_000_000, now: 0 }), {
				name: 'RangeError',
				message: 'Invalid ladder: expected ascending order, received 1500000 at 1 and 750000 at 2',
			})
		})

		it('accepts equal adjacent rungs and picks the highest position', () => {
			const selector = new ThroughputSelector()

			equal(selector.select({ ladder: [300_000, 750_000, 750_000, 1_500_000], bufferLevel: 4, throughput: 1_000_000, now: 0 }).index, 2)
		})

		it('returns rung 0 before the first sample when the throughput is unknown', () => {
			const selector = new ThroughputSelector()

			for (const throughput of [NaN, 0, -1, Infinity]) {
				equal(selector.select({ ladder, bufferLevel: 4, throughput, now: 0 }).index, 0)
			}
		})

		it('returns the current rung when the throughput is unknown', () => {
			const selector = new ThroughputSelector()
			load(selector, 3_000_000)

			equal(selector.select({ ladder, bufferLevel: 4, throughput: NaN, now: 0 }).index, 3)
		})

		it('treats an invalid bufferLevel as 0 and skips the starvation guard', () => {
			const selector = new ThroughputSelector()
			load(selector, 6_000_000)

			for (const bufferLevel of [NaN, -1, Infinity]) {
				equal(selector.select({ ladder, bufferLevel, throughput: 6_000_000, now: 0, segmentDuration: 4 }).index, 3)
			}
		})

		it('treats an invalid playbackRate as 1', () => {
			const selector = new ThroughputSelector()

			for (const playbackRate of [NaN, 0, -1, Infinity]) {
				equal(selector.select({ ladder, bufferLevel: 4, throughput: 5_000_000, now: 0, playbackRate }).index, 3)
			}
		})

		it('divides the throughput by the playback rate', () => {
			const selector = new ThroughputSelector()

			// 0.9 * 5 Mbps is 4.5 Mbps.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 5_000_000, now: 0, playbackRate: 1 }).index, 3)
			// 0.9 * 5 Mbps / 2 is 2.25 Mbps.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 5_000_000, now: 0, playbackRate: 2 }).index, 2)
		})
	})

	describe('hysteresis', () => {
		it('needs a larger margin for an upgrade than for a downgrade', () => {
			const picks: Record<number, number> = {
				1_600_000: 1,
				1_700_000: 2,
				4_200_000: 2,
				4_300_000: 3,
				8_600_000: 4,
			}

			for (const [throughput, index] of Object.entries(picks)) {
				const selector = new ThroughputSelector()
				load(selector, 1_500_000)

				equal(selector.select({ ladder, bufferLevel: 4, throughput: Number(throughput), now: 0 }).index, index, `throughput ${throughput}`)
			}
		})

		it('maps the current rung to the highest rung at or below its bitrate', () => {
			const selector = new ThroughputSelector()
			load(selector, 1_500_000)

			// The player removed the 1.5 Mbps rung. The current rung is now 750 kbps.
			// The safe pick is 3 Mbps. The upgrade pick, at 0.7 * 4.2 Mbps, is 750 kbps.
			equal(selector.select({ ladder: [300_000, 750_000, 3_000_000, 6_000_000], bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 1)
		})

		it('maps the current rung to rung 0 when no rung is at or below its bitrate', () => {
			const selector = new ThroughputSelector()
			load(selector, 300_000)

			// The current rung is rung 0 of this ladder, so the hysteresis applies.
			// The safe pick is 1.5 Mbps. The upgrade pick, at 0.7 * 1.8 Mbps, is 750 kbps.
			equal(selector.select({ ladder: [750_000, 1_500_000, 3_000_000], bufferLevel: 4, throughput: 1_800_000, now: 0 }).index, 0)
		})

		it('ignores an aborted sample', () => {
			const selector = new ThroughputSelector()
			load(selector, 1_500_000)
			load(selector, 6_000_000, true)

			// With a current rung of 6 Mbps the pick would be 3 Mbps.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 2)
		})

		it('ignores a sample whose bitrate is not a finite number', () => {
			const selector = new ThroughputSelector()
			load(selector, 1_500_000)
			load(selector, NaN)

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 2)
		})

		it('takes the current rung from the bitrate of the sample, not from the decision', () => {
			const selector = new ThroughputSelector()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 }).index, 2)

			// The player loaded 750 kbps instead of the decision.
			load(selector, 750_000)

			// The safe pick is 1.5 Mbps. From 750 kbps, the upgrade pick at 0.7 * 1.7 Mbps is 750 kbps.
			// From the 1.5 Mbps rung of the decision, the pick would be 1.5 Mbps.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 1_700_000, now: 0 }).index, 1)
		})
	})

	describe('starvation guard', () => {
		it('steps down until the download time fits in the buffer', () => {
			const picks: Record<number, number> = {
				8: 3,
				3: 3,
				1.5: 2,
				0.5: 0,
				0: 3,
			}

			for (const [bufferLevel, index] of Object.entries(picks)) {
				const selector = new ThroughputSelector()
				load(selector, 6_000_000)

				equal(selector.select({ ladder, bufferLevel: Number(bufferLevel), throughput: 6_000_000, now: 0, segmentDuration: 4 }).index, index, `bufferLevel ${bufferLevel}`)
			}
		})

		it('skips the guard when segmentDuration is not a positive number', () => {
			const selector = new ThroughputSelector()
			load(selector, 6_000_000)

			for (const segmentDuration of [undefined, 0, -4, NaN, Infinity]) {
				equal(selector.select({ ladder, bufferLevel: 0.5, throughput: 6_000_000, now: 0, segmentDuration }).index, 3)
			}
		})

		it('divides the buffer budget by the playback rate', () => {
			const selector = new ThroughputSelector()
			load(selector, 6_000_000)

			// At playback rate 1 the pick is 3 Mbps. Its download takes 2.2 s, so the 1.5 Mbps rung passes with 2 s of buffer.
			equal(selector.select({ ladder, bufferLevel: 2, throughput: 6_000_000, now: 0, segmentDuration: 4 }).index, 2)
			// At playback rate 2 the pick is 1.5 Mbps. Its download takes 1.1 s, more than the 1 s budget, so the 750 kbps rung passes.
			equal(selector.select({ ladder, bufferLevel: 2, throughput: 6_000_000, now: 0, segmentDuration: 4, playbackRate: 2 }).index, 1)
		})
	})

	describe('reset', () => {
		it('clears the current rung', () => {
			const selector = new ThroughputSelector()
			load(selector, 6_000_000)
			selector.reset()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: NaN, now: 0 }).index, 0)
			// Without a current rung there is no hysteresis.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 3)
		})
	})
})
