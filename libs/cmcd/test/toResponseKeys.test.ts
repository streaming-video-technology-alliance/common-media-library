import { deepEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { toResponseKeys } from '../src/toResponseKeys.ts'

const request = { url: 'https://cdn.test/1.m4s?CMCD=sn%3D0&a=1' }

describe('toResponseKeys', () => {
	it('derives url, rc, ts, ttfb, and ttlb', () => {
		const keys = toResponseKeys(
			{
				request,
				status: 200,
				resourceTiming: {
					startTime: 100.4,
					responseStart: 180.6,
					duration: 299.5,
					encodedBodySize: 1000,
				},
			},
			1000,
		)

		deepEqual(keys, { url: 'https://cdn.test/1.m4s?a=1', rc: 200, ts: 1100, ttfb: 80, ttlb: 300 })
	})

	it('derives only url and rc without resourceTiming', () => {
		deepEqual(toResponseKeys({ request, status: 404 }, 1000), {
			url: 'https://cdn.test/1.m4s?a=1',
			rc: 404,
		})
	})

	it('omits ttfb when responseStart is 0, missing, or earlier than startTime', () => {
		for (const responseStart of [0, undefined, 50]) {
			const keys = toResponseKeys(
				{
					request,
					status: 200,
					resourceTiming: { startTime: 100, responseStart, duration: 300, encodedBodySize: 0 },
				},
				1000,
			)

			deepEqual(keys, { url: 'https://cdn.test/1.m4s?a=1', rc: 200, ts: 1100, ttlb: 300 })
		}
	})

	it('omits ttlb when duration is 0', () => {
		const keys = toResponseKeys(
			{
				request,
				status: 200,
				resourceTiming: { startTime: 100, responseStart: 100, duration: 0, encodedBodySize: 0 },
			},
			1000,
		)

		deepEqual(keys, { url: 'https://cdn.test/1.m4s?a=1', rc: 200, ts: 1100, ttfb: 0 })
	})
})
