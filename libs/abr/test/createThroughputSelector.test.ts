import type { BitrateSelector, LadderRung } from '@svta/cml-abr'
import {
	createThroughputSelector,
	DEFAULT_SAFETY_FACTOR,
	DEFAULT_STARVATION_TOLERANCE,
	DEFAULT_UPGRADE_FACTOR,
} from '@svta/cml-abr'
import { deepEqual, equal, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

function rungs(...bandwidths: number[]): LadderRung[] {
	return bandwidths.map(bandwidth => ({ bandwidth }))
}

const ladder = rungs(300_000, 750_000, 1_500_000, 3_000_000, 6_000_000)

// Records a 4 second segment of `bandwidth` as the current rung of `selector`.
function load(selector: BitrateSelector, bandwidth: number, aborted?: boolean): void {
	selector.sample({
		timing: { startTime: 0, encodedBodySize: bandwidth / 2, duration: 500 },
		bandwidth,
		duration: 4,
		bufferLevel: 4,
		aborted,
	})
}

// Records a 4 second segment of 6 Mbps with a time to first byte of `timeToFirstByteMs`.
function loadWithTimeToFirstByte(
	selector: BitrateSelector,
	timeToFirstByteMs: number,
	aborted?: boolean,
): void {
	selector.sample({
		timing: {
			startTime: 0,
			responseStart: timeToFirstByteMs,
			duration: timeToFirstByteMs + 500,
			encodedBodySize: 3_000_000,
		},
		bandwidth: 6_000_000,
		duration: 4,
		bufferLevel: 4,
		aborted,
	})
}

describe('createThroughputSelector', () => {
	describe('options', () => {
		it('exports the defaults', () => {
			equal(DEFAULT_SAFETY_FACTOR, 0.9)
			equal(DEFAULT_UPGRADE_FACTOR, 0.7)
			equal(DEFAULT_STARVATION_TOLERANCE, 4)
		})

		it('throws when safetyFactor is not a finite number above 0 and at most 1', () => {
			for (const safetyFactor of [0, -0.5, 1.5, NaN, Infinity]) {
				throws(() => createThroughputSelector({ safetyFactor }), {
					name: 'RangeError',
					message: `Invalid safetyFactor: expected a finite number above 0 and at most 1, received ${safetyFactor}`,
				})
			}
		})

		it('throws when upgradeFactor is not a finite number above 0 and at most 1', () => {
			for (const upgradeFactor of [0, -0.5, 1.5, NaN, Infinity]) {
				throws(() => createThroughputSelector({ upgradeFactor }), {
					name: 'RangeError',
					message: `Invalid upgradeFactor: expected a finite number above 0 and at most 1, received ${upgradeFactor}`,
				})
			}
		})

		it('throws when upgradeFactor is above safetyFactor', () => {
			throws(() => createThroughputSelector({ safetyFactor: 0.8, upgradeFactor: 0.9 }), {
				name: 'RangeError',
				message:
					'Invalid upgradeFactor: expected a value at or below safetyFactor 0.8, received 0.9',
			})
		})

		it('throws when starvationTolerance is not a finite number of 0 or more', () => {
			for (const starvationTolerance of [-1, NaN, Infinity]) {
				throws(() => createThroughputSelector({ starvationTolerance }), {
					name: 'RangeError',
					message: `Invalid starvationTolerance: expected a finite number of 0 or more, received ${starvationTolerance}`,
				})
			}
		})

		it('accepts equal factors and disables the hysteresis', () => {
			const selector = createThroughputSelector({ safetyFactor: 0.9, upgradeFactor: 0.9 })
			load(selector, 750_000)

			// 0.9 * 1.7 Mbps is 1.53 Mbps, so the upgrade to 1.5 Mbps needs no extra margin.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 1_700_000, now: 0 }).index, 2)
		})
	})

	describe('select', () => {
		it('picks the highest rung at or below the safe throughput', () => {
			//#region example
			const selector = createThroughputSelector()
			const ladder = [
				{ bandwidth: 300_000 },
				{ bandwidth: 750_000 },
				{ bandwidth: 1_500_000 },
				{ bandwidth: 3_000_000 },
				{ bandwidth: 6_000_000 },
			]

			const { index } = selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 })

			// The highest rung at or below 0.9 * 3 Mbps is 1.5 Mbps.
			equal(index, 2)
			//#endregion example
		})

		it('returns a delay of 0', () => {
			const selector = createThroughputSelector()

			deepEqual(selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 }), {
				index: 2,
				delay: 0,
			})
		})

		it('picks rung 0 when no rung fits', () => {
			const selector = createThroughputSelector()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 200_000, now: 0 }).index, 0)
		})

		it('picks the top rung when every rung fits', () => {
			const selector = createThroughputSelector()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 100_000_000, now: 0 }).index, 4)
		})

		it('throws when the ladder is empty', () => {
			const selector = createThroughputSelector()

			throws(() => selector.select({ ladder: [], bufferLevel: 4, throughput: 3_000_000, now: 0 }), {
				name: 'RangeError',
				message: 'Invalid ladder: expected at least one rung, received an empty array',
			})
		})

		it('throws when a bandwidth is not a positive finite number', () => {
			const selector = createThroughputSelector()

			for (const bandwidth of [NaN, 0, -1, Infinity]) {
				throws(
					() =>
						selector.select({
							ladder: rungs(300_000, bandwidth, 1_500_000),
							bufferLevel: 4,
							throughput: 3_000_000,
							now: 0,
						}),
					{
						name: 'RangeError',
						message: `Invalid ladder: expected a positive finite bandwidth at 1, received ${bandwidth}`,
					},
				)
			}
		})

		it('throws when the ladder is not in ascending order of bandwidth', () => {
			const selector = createThroughputSelector()

			throws(
				() =>
					selector.select({
						ladder: rungs(300_000, 1_500_000, 750_000),
						bufferLevel: 4,
						throughput: 3_000_000,
						now: 0,
					}),
				{
					name: 'RangeError',
					message:
						'Invalid ladder: expected ascending bandwidth, received 1500000 at 1 and 750000 at 2',
				},
			)
		})

		it('accepts equal neighbouring bandwidths and picks the highest position', () => {
			const selector = createThroughputSelector()

			equal(
				selector.select({
					ladder: rungs(300_000, 750_000, 750_000, 1_500_000),
					bufferLevel: 4,
					throughput: 1_000_000,
					now: 0,
				}).index,
				2,
			)
		})

		it('returns rung 0 before the first sample when the throughput is unknown', () => {
			const selector = createThroughputSelector()

			for (const throughput of [NaN, -1, Infinity]) {
				equal(selector.select({ ladder, bufferLevel: 4, throughput, now: 0 }).index, 0)
			}
		})

		it('returns the current rung when the throughput is unknown', () => {
			const selector = createThroughputSelector()
			load(selector, 3_000_000)

			for (const throughput of [NaN, -1, Infinity]) {
				equal(selector.select({ ladder, bufferLevel: 4, throughput, now: 0 }).index, 3)
			}
		})

		it('picks rung 0 when the throughput is 0', () => {
			const selector = createThroughputSelector()
			load(selector, 3_000_000)

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 0, now: 0 }).index, 0)
		})

		it('treats an invalid bufferLevel as 0', () => {
			const selector = createThroughputSelector()
			load(selector, 6_000_000)

			// At a buffer level of 0 the second pass of the guard allows 4 s, so the 3 Mbps rung passes.
			for (const bufferLevel of [NaN, -1, Infinity]) {
				equal(
					selector.select({
						ladder,
						bufferLevel,
						throughput: 6_000_000,
						now: 0,
						segmentDuration: 4,
					}).index,
					3,
				)
			}
		})

		it('treats an invalid playbackRate as 1', () => {
			const selector = createThroughputSelector()

			for (const playbackRate of [NaN, 0, -1, Infinity]) {
				equal(
					selector.select({ ladder, bufferLevel: 4, throughput: 5_000_000, now: 0, playbackRate })
						.index,
					3,
				)
			}
		})

		it('divides the throughput by the playback rate', () => {
			const selector = createThroughputSelector()

			// 0.9 * 5 Mbps is 4.5 Mbps.
			equal(
				selector.select({ ladder, bufferLevel: 4, throughput: 5_000_000, now: 0, playbackRate: 1 })
					.index,
				3,
			)
			// 0.9 * 5 Mbps / 2 is 2.25 Mbps.
			equal(
				selector.select({ ladder, bufferLevel: 4, throughput: 5_000_000, now: 0, playbackRate: 2 })
					.index,
				2,
			)
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
				const selector = createThroughputSelector()
				load(selector, 1_500_000)

				equal(
					selector.select({ ladder, bufferLevel: 4, throughput: Number(throughput), now: 0 }).index,
					index,
					`throughput ${throughput}`,
				)
			}
		})

		it('maps the current rung to the highest rung at or below its bandwidth', () => {
			const selector = createThroughputSelector()
			load(selector, 1_500_000)

			// The player removed the 1.5 Mbps rung. The current rung is now 750 kbps.
			// The safe pick is 3 Mbps. The upgrade pick, at 0.7 * 4.2 Mbps, is 750 kbps.
			equal(
				selector.select({
					ladder: rungs(300_000, 750_000, 3_000_000, 6_000_000),
					bufferLevel: 4,
					throughput: 4_200_000,
					now: 0,
				}).index,
				1,
			)
		})

		it('maps the current rung to rung 0 when no rung is at or below its bandwidth', () => {
			const selector = createThroughputSelector()
			load(selector, 300_000)

			// The current rung is rung 0 of this ladder, so the hysteresis applies.
			// The safe pick is 1.5 Mbps. The upgrade pick, at 0.7 * 1.8 Mbps, is 750 kbps.
			equal(
				selector.select({
					ladder: rungs(750_000, 1_500_000, 3_000_000),
					bufferLevel: 4,
					throughput: 1_800_000,
					now: 0,
				}).index,
				0,
			)
		})

		it('ignores an aborted sample', () => {
			const selector = createThroughputSelector()
			load(selector, 1_500_000)
			load(selector, 6_000_000, true)

			// With a current rung of 6 Mbps the pick would be 3 Mbps.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 2)
		})

		it('ignores a sample whose bandwidth is not a finite number', () => {
			const selector = createThroughputSelector()
			load(selector, 1_500_000)
			load(selector, NaN)

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 2)
		})

		it('takes the current rung from the bandwidth of the sample, not from the decision', () => {
			const selector = createThroughputSelector()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: 3_000_000, now: 0 }).index, 2)

			// The player loaded 750 kbps instead of the decision.
			load(selector, 750_000)

			// The safe pick is 1.5 Mbps. From 750 kbps, the upgrade pick at 0.7 * 1.7 Mbps is 750 kbps.
			// From the 1.5 Mbps rung of the decision, the pick would be 1.5 Mbps.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 1_700_000, now: 0 }).index, 1)
		})
	})

	describe('starvation guard', () => {
		it('keeps the highest rung that downloads before the buffer empties, or allows the tolerance', () => {
			// The pick is 3 Mbps, which downloads in 2.2 s at the safe throughput of 5.4 Mbps.
			// Below 0.2 s no rung passes the first pass, and the second pass allows 4 s more.
			const picks: Record<number, number> = {
				8: 3,
				1.5: 2,
				0.5: 0,
				0.1: 3,
				0: 3,
			}

			for (const [bufferLevel, index] of Object.entries(picks)) {
				const selector = createThroughputSelector()
				load(selector, 6_000_000)

				equal(
					selector.select({
						ladder,
						bufferLevel: Number(bufferLevel),
						throughput: 6_000_000,
						now: 0,
						segmentDuration: 4,
					}).index,
					index,
					`bufferLevel ${bufferLevel}`,
				)
			}
		})

		it('steps down in the second pass when long segments exceed the tolerance', () => {
			// With 10 s segments the 3 Mbps rung downloads in 5.6 s and the 1.5 Mbps rung in 2.8 s.
			const picks: Record<number, number> = {
				8: 3,
				2: 1,
				1: 0,
				0.5: 2,
				0: 2,
			}

			for (const [bufferLevel, index] of Object.entries(picks)) {
				const selector = createThroughputSelector()
				load(selector, 6_000_000)

				equal(
					selector.select({
						ladder,
						bufferLevel: Number(bufferLevel),
						throughput: 6_000_000,
						now: 0,
						segmentDuration: 10,
					}).index,
					index,
					`bufferLevel ${bufferLevel}`,
				)
			}
		})

		it('uses the starvationTolerance option in the second pass', () => {
			const selector = createThroughputSelector({ starvationTolerance: 1 })
			load(selector, 6_000_000)

			// The budget is 1 s. The 750 kbps rung downloads in 0.56 s.
			equal(
				selector.select({
					ladder,
					bufferLevel: 0,
					throughput: 6_000_000,
					now: 0,
					segmentDuration: 4,
				}).index,
				1,
			)
		})

		it('passes rung 0 in the second pass with a tolerance of 0', () => {
			const selector = createThroughputSelector({ starvationTolerance: 0 })
			load(selector, 6_000_000)

			equal(
				selector.select({
					ladder,
					bufferLevel: 0,
					throughput: 6_000_000,
					now: 0,
					segmentDuration: 4,
				}).index,
				0,
			)
		})

		it('falls through to rung 0 when the throughput is 0', () => {
			const selector = createThroughputSelector()
			load(selector, 6_000_000)

			// Every download time is Infinity, so neither pass keeps a rung above 0.
			equal(
				selector.select({ ladder, bufferLevel: 8, throughput: 0, now: 0, segmentDuration: 4 })
					.index,
				0,
			)
		})

		it('skips the guard when segmentDuration is not a positive number', () => {
			const selector = createThroughputSelector()
			load(selector, 6_000_000)

			for (const segmentDuration of [undefined, 0, -4, NaN, Infinity]) {
				equal(
					selector.select({
						ladder,
						bufferLevel: 0.5,
						throughput: 6_000_000,
						now: 0,
						segmentDuration,
					}).index,
					3,
				)
			}
		})

		it('divides the buffer budget by the playback rate', () => {
			const selector = createThroughputSelector()
			load(selector, 6_000_000)

			// At playback rate 1 the pick is 3 Mbps. Its download takes 2.2 s, so the 1.5 Mbps rung passes with 2 s of buffer.
			equal(
				selector.select({
					ladder,
					bufferLevel: 2,
					throughput: 6_000_000,
					now: 0,
					segmentDuration: 4,
				}).index,
				2,
			)
			// At playback rate 2 the pick is 1.5 Mbps. Its download takes 1.1 s, more than the 1 s budget, so the 750 kbps rung passes.
			equal(
				selector.select({
					ladder,
					bufferLevel: 2,
					throughput: 6_000_000,
					now: 0,
					segmentDuration: 4,
					playbackRate: 2,
				}).index,
				1,
			)
		})

		it('adds the mean time to first byte of the last four samples to the download time', () => {
			// The pick is 3 Mbps, which downloads in 2.2 s at the safe throughput of 5.4 Mbps.
			// The last four samples have a time to first byte of 1 s, so the download needs 3.2 s.
			const selector = createThroughputSelector()
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			for (let i = 0; i < 4; i++) {
				loadWithTimeToFirstByte(selector, 1000)
			}

			equal(selector.select({ ...input, bufferLevel: 3 }).index, 2)
			equal(selector.select({ ...input, bufferLevel: 3.5 }).index, 3)
		})

		it('drops the time to first byte of a sample before the last four', () => {
			const selector = createThroughputSelector()
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			loadWithTimeToFirstByte(selector, 10_000)
			for (let i = 0; i < 4; i++) {
				loadWithTimeToFirstByte(selector, 1000)
			}

			equal(selector.select({ ...input, bufferLevel: 3.5 }).index, 3)
		})

		it('ignores the time to first byte of an aborted sample', () => {
			const selector = createThroughputSelector()
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			for (let i = 0; i < 4; i++) {
				loadWithTimeToFirstByte(selector, 1000)
			}
			loadWithTimeToFirstByte(selector, 20_000, true)

			equal(selector.select({ ...input, bufferLevel: 3.5 }).index, 3)
		})

		it('does not count a sample without responseStart as a time to first byte of 0', () => {
			// Two samples have a time to first byte of 1 s and two have no responseStart. The mean stays 1 s, so the download needs 3.2 s.
			const selector = createThroughputSelector()
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			loadWithTimeToFirstByte(selector, 1000)
			load(selector, 6_000_000)
			loadWithTimeToFirstByte(selector, 1000)
			load(selector, 6_000_000)

			equal(selector.select({ ...input, bufferLevel: 3 }).index, 2)
		})

		it('forgets the time to first byte samples after a reset', () => {
			const selector = createThroughputSelector()
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			for (let i = 0; i < 4; i++) {
				loadWithTimeToFirstByte(selector, 1000)
			}
			selector.reset()
			load(selector, 6_000_000)

			equal(selector.select({ ...input, bufferLevel: 3 }).index, 3)
		})

		it('ignores the time to first byte when ignoreTimeToFirstByte is set', () => {
			// Without the option, four samples with a 1 s time to first byte lower the pick at a buffer of 3 s to rung 2.
			const selector = createThroughputSelector({ ignoreTimeToFirstByte: true })
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			for (let i = 0; i < 4; i++) {
				loadWithTimeToFirstByte(selector, 1000)
			}

			equal(selector.select({ ...input, bufferLevel: 3 }).index, 3)
		})
	})

	describe('reset', () => {
		it('clears the current rung', () => {
			const selector = createThroughputSelector()
			load(selector, 6_000_000)
			selector.reset()

			equal(selector.select({ ladder, bufferLevel: 4, throughput: NaN, now: 0 }).index, 0)
			// Without a current rung there is no hysteresis.
			equal(selector.select({ ladder, bufferLevel: 4, throughput: 4_200_000, now: 0 }).index, 3)
		})
	})
})
