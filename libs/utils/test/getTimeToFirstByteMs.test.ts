import { getTimeToFirstByteMs, getTransferDurationMs } from '@svta/cml-utils'
import { equal, ok } from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('getTimeToFirstByteMs', () => {
	it('returns the time from the start to the first byte when the sample has responseStart', () => {
		//#region example
		// 800 ms to the first byte, then a 50 ms transfer.
		const timeToFirstByteMs = getTimeToFirstByteMs({
			startTime: 1000,
			responseStart: 1800,
			duration: 850,
			encodedBodySize: 112_000,
		})

		equal(timeToFirstByteMs, 800)
		//#endregion example
	})

	it('returns NaN when the sample has no responseStart', () => {
		ok(
			Number.isNaN(
				getTimeToFirstByteMs({ startTime: 1000, duration: 850, encodedBodySize: 112_000 }),
			),
		)
	})

	it('returns NaN when responseStart is not a finite number', () => {
		for (const responseStart of [NaN, Infinity, -Infinity]) {
			ok(
				Number.isNaN(
					getTimeToFirstByteMs({
						startTime: 1000,
						responseStart,
						duration: 850,
						encodedBodySize: 1,
					}),
				),
				`expected NaN for responseStart ${responseStart}`,
			)
		}
	})

	it('returns NaN when responseStart is before startTime or after the response end', () => {
		for (const responseStart of [999, 1851]) {
			ok(
				Number.isNaN(
					getTimeToFirstByteMs({
						startTime: 1000,
						responseStart,
						duration: 850,
						encodedBodySize: 1,
					}),
				),
				`expected NaN for responseStart ${responseStart}`,
			)
		}
	})

	it('returns 0 when the first byte arrived at the start', () => {
		equal(
			getTimeToFirstByteMs({
				startTime: 1000,
				responseStart: 1000,
				duration: 850,
				encodedBodySize: 1,
			}),
			0,
		)
	})

	it('returns NaN for every responseStart that getTransferDurationMs rejects', () => {
		for (const responseStart of [NaN, Infinity, -Infinity, 999, 1851]) {
			const sample = { startTime: 1000, responseStart, duration: 850, encodedBodySize: 1 }

			ok(
				Number.isNaN(getTimeToFirstByteMs(sample)),
				`expected NaN for responseStart ${responseStart}`,
			)
			equal(
				getTransferDurationMs(sample),
				850,
				`expected duration for responseStart ${responseStart}`,
			)
		}

		const noDuration = { startTime: 1000, responseStart: 1300, duration: NaN, encodedBodySize: 1 }

		ok(Number.isNaN(getTimeToFirstByteMs(noDuration)))
		ok(Number.isNaN(getTransferDurationMs(noDuration)))
	})

	it('adds up with getTransferDurationMs to duration', () => {
		const sample = { startTime: 1000, responseStart: 1300, duration: 850, encodedBodySize: 1 }

		equal(getTimeToFirstByteMs(sample) + getTransferDurationMs(sample), sample.duration)
	})
})
