import { getBandwidthBps } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('getBandwidthBps', () => {
	it('divides the body size by the transfer duration', () => {
		//#region example
		// 112 kB that waited 800 ms for the first byte and transferred in 50 ms.
		const bandwidthBps = getBandwidthBps({
			startTime: 0,
			responseStart: 800,
			duration: 850,
			encodedBodySize: 112_000,
		})

		equal(bandwidthBps, 17_920_000)
		//#endregion example
	})

	it('divides by duration when the sample has no responseStart', () => {
		equal(getBandwidthBps({ startTime: 0, duration: 1000, encodedBodySize: 750_000 }), 6_000_000)
	})
})
