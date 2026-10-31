import type { CmcdReportFilter, CmcdSessionConfig } from '@svta/cml-cmcd'
import {
	CMCD_EVENT_HOSTNAME,
	CmcdEventType,
	CmcdPlayerState,
	createCmcdSession,
} from '@svta/cml-cmcd'
import { SfItem } from '@svta/cml-structured-field-values'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, vi } from 'vite-plus/test'

const SEGMENT = 'https://cdn.test/v/1.m4s'
const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, request => {
		posts.push(request)
		return Promise.resolve({ status: 200 })
	})
	const lines = (url?: string): string[] =>
		posts
			.filter(post => !url || post.url === url)
			.flatMap(post => (post.body as string).split('\n'))

	return { session, posts, lines }
}

describe('createCmcdSession events', () => {
	beforeEach(() => vi.useFakeTimers({ now: ts, toFake: ['Date'] }))
	afterEach(() => vi.useRealTimers())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		const session = createCmcdSession(
			{
				sid: 'session-1',
				cid: 'movie-42',
				eventTargets: [
					{
						url: 'https://collector.example.com/cmcd',
						events: [CmcdEventType.PLAY_STATE],
						filter: report => report.sta !== CmcdPlayerState.SEEKING,
					},
				],
			},
			request => {
				bodies.push(request.body as string)
				return Promise.resolve({ status: 200 })
			},
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.SEEKING })
		session.recordEvent(CmcdEventType.PLAY_STATE, {
			sta: CmcdPlayerState.PLAYING,
			ts: 1767225600000,
		})

		equal(bodies[0], 'cid="movie-42",e=ps,sid="session-1",sn=0,sta=p,ts=1767225600000,v=2')
		// #endregion example
	})

	describe('recordEvent', () => {
		it('sends a report to each target that lists the event, with a sequence number for each target', async () => {
			const { session, lines } = setup({
				eventTargets: [
					{ url: A, events: [CmcdEventType.PLAY_STATE] },
					{ url: B, events: [CmcdEventType.PLAY_STATE] },
				],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordEvent(CmcdEventType.MUTE)
			await settle()

			for (const url of [A, B]) {
				deepEqual(lines(url), [
					`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
					`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
				])
			}
		})

		it('gives each target its own sequence, also when two targets share a URL', async () => {
			const { session, lines } = setup({
				eventTargets: [
					{ url: A, events: [CmcdEventType.PLAY_STATE] },
					{ url: A, events: [CmcdEventType.PLAY_STATE], filter: report => report.sta === 'p' },
				],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(lines(), [
				`e=ps,sid="s1",sn=0,sta=a,ts=${ts},v=2`,
				`e=ps,sid="s1",sn=1,sta=p,ts=${ts},v=2`,
				`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			])
		})

		it('calls the filter with e, ts, and the request, before it uses a sequence number', () => {
			const calls: Parameters<CmcdReportFilter>[] = []
			const { session, lines } = setup({
				eventTargets: [
					{
						url: A,
						events: [CmcdEventType.PLAY_STATE],
						filter: (report, request) => {
							calls.push([report, request])
							return report.sta !== 'a'
						},
					},
				],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' }, { url: SEGMENT })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(calls[0], [{ sta: 'a', e: 'ps', ts }, { url: SEGMENT }])
			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})

		it('gives the error of a filter to the caller, and no target receives the report', () => {
			let fail = true
			const { session, lines } = setup({
				eventTargets: [
					{ url: A, events: [CmcdEventType.PLAY_STATE] },
					{
						url: B,
						events: [CmcdEventType.PLAY_STATE],
						filter: () => {
							if (fail) {
								throw new Error('filter failed')
							}
							return true
						},
					},
				],
			})

			throws(() => session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' }), /filter failed/)
			fail = false
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })

			deepEqual(lines(), [
				`e=ps,sid="s1",sn=0,sta=a,ts=${ts},v=2`,
				`e=ps,sid="s1",sn=0,sta=a,ts=${ts},v=2`,
			])
		})

		it('types the arguments of a filter as deeply read-only', () => {
			const filter: CmcdReportFilter = (report, request) => {
				const list = report.bl ?? []

				// @ts-expect-error A filter cannot change a nested value of the report.
				list[0] = 1
				// @ts-expect-error A filter cannot change the request.
				request.url = 'x'
				return true
			}

			ok(filter)
		})

		it('ignores sid, sn, and e in the data, and uses the configured cid when the data has none', async () => {
			const { session, lines } = setup({
				cid: 'c1',
				eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
			})

			session.recordEvent(
				CmcdEventType.PLAY_STATE,
				// @ts-expect-error - The data type leaves out sid, sn, and e. A JavaScript caller can still pass them.
				{ sid: 'x', sn: 7, e: 'rr', cid: undefined, sta: 'p' },
			)
			session.recordEvent(CmcdEventType.PLAY_STATE, { cid: 'ad-7', sta: 'a' })
			await settle()

			deepEqual(lines(), [
				`cid="c1",e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
				`cid="ad-7",e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
			])
		})

		it('writes the exit from backgrounded mode without bg', async () => {
			const { session, lines } = setup({
				eventTargets: [{ url: A, events: [CmcdEventType.BACKGROUNDED_MODE] }],
			})

			session.recordEvent(CmcdEventType.BACKGROUNDED_MODE, { bg: true })
			session.recordEvent(CmcdEventType.BACKGROUNDED_MODE, { bg: false })
			session.recordEvent(CmcdEventType.BACKGROUNDED_MODE, {
				bg: new SfItem(false, { x: 1 }) as unknown as boolean,
			})
			await settle()

			deepEqual(lines(), [
				`bg,e=b,sid="s1",sn=0,ts=${ts},v=2`,
				`e=b,sid="s1",sn=1,ts=${ts},v=2`,
				`e=b,sid="s1",sn=2,ts=${ts},v=2`,
			])
		})

		it('keeps only the enabled keys and the keys that the event requires', () => {
			const { session, lines } = setup({
				eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE], enabledKeys: ['sid', 'sn'] }],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bl: [100] })

			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})

		it('records the h event with the new host', () => {
			const { session, lines } = setup({
				eventTargets: [{ url: A, events: [CmcdEventType.HOSTNAME] }],
			})

			session.recordEvent(CMCD_EVENT_HOSTNAME, { h: 'cdn2.example.com' })

			equal(CmcdEventType.HOSTNAME, 'h')
			deepEqual(lines(), [`e=h,h="cdn2.example.com",sid="s1",sn=0,ts=${ts},v=2`])
		})

		it('throws for a value that cannot be encoded, and keeps the sequence number', () => {
			const { session, lines } = setup({
				eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
			})

			throws(() =>
				session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', 'com.example-name': 'a\nb' }),
			)
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})
	})

	describe('batches', () => {
		it('posts a batch of batchSize lines, and flush() posts the rest after the response', async () => {
			const { session, posts } = setup({
				eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE], batchSize: 2 }],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.flush()
			equal(posts.length, 1)
			await settle()

			deepEqual(posts, [
				{
					url: A,
					method: 'POST',
					headers: { 'Content-Type': 'application/cmcd' },
					body: `e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2\ne=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
				},
				{
					url: A,
					method: 'POST',
					headers: { 'Content-Type': 'application/cmcd' },
					body: `e=ps,sid="s1",sn=2,sta=p,ts=${ts},v=2`,
				},
			])
		})

		it('keeps one POST in flight for each target, and sends the waiting lines after the response', async () => {
			const posts: HttpRequest[] = []
			const replies: ((status: number) => void)[] = []
			const session = createCmcdSession(
				{ sid: 's1', eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] },
				request =>
					new Promise(resolve => {
						posts.push(request)
						replies.push(status => resolve({ status }))
					}),
			)

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			equal(posts.length, 1)
			replies[0](200)
			await settle()

			equal(posts.length, 2)
			equal(
				posts[1].body,
				`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2\ne=ps,sid="s1",sn=2,sta=p,ts=${ts},v=2`,
			)
		})

		it('posts with fetch and without keepalive by default', () => {
			const fetch = vi
				.spyOn(globalThis, 'fetch')
				.mockResolvedValue(new Response(null, { status: 200 }))
			const session = createCmcdSession({
				sid: 's1',
				eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			equal(fetch.mock.calls.length, 1)
			deepEqual(fetch.mock.calls[0], [
				A,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/cmcd' },
					body: `e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
				},
			])
		})
	})
})
