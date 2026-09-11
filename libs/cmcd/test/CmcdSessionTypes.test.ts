import type { CmcdDecoratedRequest, CmcdPlaybackData, CmcdResponseData, CmcdSessionConfig, CmcdSessionReporter } from '@svta/cml-cmcd'
import { CmcdEventType, validateCmcdEvents } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('CMCD session API types', () => {
	it('exposes the h event', () => {
		equal(CmcdEventType.HOSTNAME, 'h')
		equal(validateCmcdEvents('e=h,h="example.com",sid="s",ts=1,v=2').valid, true)
	})

	it('compiles the documented shapes', () => {
		const data: CmcdPlaybackData = { sta: 'p', bl: { v: 3200, a: 1800 }, br: 3000, nor: [{ url: 'seg.m4s', range: '0-99' }], 'com.example-key': 'x', ts: 1 }
		// @ts-expect-error ec is not a member, errors go through recordError()
		const bad: CmcdPlaybackData = { ec: ['x'] }
		const response: CmcdResponseData = { ...data, ttfbb: 12, smrt: 'abc' }
		// @ts-expect-error sn is reporter-owned
		const badResponse: CmcdResponseData = { sn: 1 }
		const config: CmcdSessionConfig = { derive: { bg: false }, eventTargets: [{ url: 'https://c.example/cmcd' }] }
		type Decorated = CmcdDecoratedRequest<{ url: string; retries: number }>
		const decorated = { url: 'u', retries: 1, cmcd: { sid: 's', data: {} } } as Decorated
		const headers: Readonly<Record<string, string>> | undefined = decorated.headers
		type Recorder = CmcdSessionReporter['recordEvent']
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const recordEvent: Recorder = () => {}
		// @ts-expect-error ps is derived from update(), not recordable
		recordEvent('ps')
		equal([data, bad, response, badResponse, config, headers].length, 6)
	})
})
