import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { downloadTime } from '../src/downloadTime.ts'

describe('downloadTime', () => {
	it('adds the time to first byte to the transfer of one segment', () => {
		// 3 Mbps for 2 seconds is 6 Mbit. At 12.6 Mbps the transfer takes 0.476 s.
		equal(downloadTime({ bandwidth: 3_000_000 }, 2, 12_600_000, 0.8), 0.8 + 6_000_000 / 12_600_000)
	})

	it('is infinite at a safe throughput of 0', () => {
		equal(downloadTime({ bandwidth: 3_000_000 }, 2, 0, 0), Infinity)
	})
})
