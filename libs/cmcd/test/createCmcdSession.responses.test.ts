import { CmcdEventType, CmcdObjectType, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok } from 'node:assert'
import { afterEach, beforeEach, describe, it, vi } from 'vite-plus/test'

const SEGMENT = 'https://cdn.test/v/1.m4s'
const A = 'https://a.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

function setup() {
	const posts: HttpRequest[] = []
	const session = createCmcdSession(
		{ sid: 's1', eventTargets: [{ url: A, events: [CmcdEventType.RESPONSE_RECEIVED] }] },
		request => {
			posts.push(request)
			return Promise.resolve({ status: 200 })
		},
	)
	const lines = (): string[] => posts.flatMap(post => (post.body as string).split('\n'))

	return { session, lines }
}

describe('createCmcdSession responses', () => {
	beforeEach(() => vi.useFakeTimers({ now: ts, toFake: ['Date'] }))
	afterEach(() => vi.useRealTimers())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		const settings = [
			{ url: 'https://collector.example.com/cmcd', includeInRequests: ['segment'] },
			{ url: 'https://collector.example.com/cmcd', includeInRequests: ['mpd'] },
		]

		const session = createCmcdSession(
			{
				eventTargets: settings.map(target => ({
					url: target.url,
					events: [CmcdEventType.RESPONSE_RECEIVED],
					filter: (report, request) => {
						const { requestType } = (request?.customData ?? {}) as { requestType?: string }

						return (
							report.e !== CmcdEventType.RESPONSE_RECEIVED ||
							target.includeInRequests.includes(requestType ?? '')
						)
					},
				})),
			},
			request => {
				bodies.push(request.body as string)
				return Promise.resolve({ status: 200 })
			},
		)

		session.recordResponseReceived({
			request: {
				url: 'https://cdn.example.com/movie/seg-1.m4s',
				customData: { requestType: 'segment' },
			},
			status: 200,
		})
		session.recordResponseReceived({
			request: { url: 'https://cdn.example.com/movie.mpd', customData: { requestType: 'mpd' } },
			status: 200,
		})

		equal(bodies.length, 2)
		ok(
			bodies[0].includes('sn=0') &&
				bodies[0].includes('url="https://cdn.example.com/movie/seg-1.m4s"'),
		)
		ok(bodies[1].includes('sn=0') && bodies[1].includes('url="https://cdn.example.com/movie.mpd"'))
		// #endregion example
	})

	it('derives url, rc, ts, ttfb, and ttlb', () => {
		const { session, lines } = setup()

		session.recordResponseReceived({
			request: { url: `${SEGMENT}?CMCD=sn%3D0&a=1` },
			status: 200,
			resourceTiming: { startTime: 100, responseStart: 180, duration: 300, encodedBodySize: 1000 },
		})

		deepEqual(lines(), [
			`e=rr,rc=200,sid="s1",sn=0,ts=${Math.round(performance.timeOrigin + 100)},ttfb=80,ttlb=300,url="${SEGMENT}?a=1",v=2`,
		])
	})

	it('adds the request-time data without the keys that have a destination scope, and data overrides the derived keys', async () => {
		const { session, lines } = setup()

		const report = session.createRequestReport(
			{ url: SEGMENT },
			{ ot: CmcdObjectType.VIDEO, br: [3000], msd: 700, bs: true, bsd: [300] },
		)
		session.recordResponseReceived({ request: report, status: 200 }, { rc: 206, ttfbb: 60 })
		session.recordResponseReceived({ request: { url: 'https://cdn.test/v/2.m4s' }, status: 404 })
		await settle()

		deepEqual(lines(), [
			`br=(3000),bs,bsd=(300),e=rr,msd=700,ot=v,rc=206,sid="s1",sn=0,ts=${ts},ttfbb=60,url="${SEGMENT}",v=2`,
			`e=rr,rc=404,sid="s1",sn=1,ts=${ts},url="https://cdn.test/v/2.m4s",v=2`,
		])
	})
})
