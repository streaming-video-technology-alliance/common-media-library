import { getTransferDuration } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('getTransferDuration', () => {
	it('returns the time from the first byte to the end when the sample has responseStart', () => {
		//#region example
		// 800 ms to the first byte, then a 50 ms transfer.
		const transferDuration = getTransferDuration({
			startTime: 1000,
			responseStart: 1800,
			duration: 850,
			encodedBodySize: 112_000,
		})

		equal(transferDuration, 50)
		//#endregion example
	})

	it('returns duration when the sample has no responseStart', () => {
		equal(getTransferDuration({ startTime: 1000, duration: 850, encodedBodySize: 112_000 }), 850)
	})

	it('returns duration when responseStart is not a finite number', () => {
		for (const responseStart of [NaN, Infinity, -Infinity]) {
			equal(
				getTransferDuration({
					startTime: 1000,
					responseStart,
					duration: 850,
					encodedBodySize: 1,
				}),
				850,
				`expected duration for responseStart ${responseStart}`,
			)
		}
	})

	it('returns duration when responseStart is before startTime or after the response end', () => {
		equal(
			getTransferDuration({
				startTime: 1000,
				responseStart: 999,
				duration: 850,
				encodedBodySize: 1,
			}),
			850,
		)
		equal(
			getTransferDuration({
				startTime: 1000,
				responseStart: 1851,
				duration: 850,
				encodedBodySize: 1,
			}),
			850,
		)
	})

	it('returns 0 when the body arrived with the first byte', () => {
		equal(
			getTransferDuration({
				startTime: 1000,
				responseStart: 1850,
				duration: 850,
				encodedBodySize: 1,
			}),
			0,
		)
	})
})
