import type {
	CmcdEventSender,
	CmcdSessionConfig,
	CmcdSessionEventReportConfig,
} from '@svta/cml-cmcd'
import {
	CmcdEventType,
	CmcdPlayerState,
	CmcdReportingMode,
	createCmcdSession,
	encodeCmcd,
	toCmcdValue,
} from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, vi } from 'vite-plus/test'

const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

type Reply = number | 'reject' | 'throw'
type SendReply = 'resolve' | 'gone' | 'reject' | 'throw'
type Report = Parameters<CmcdEventSender>[0][number]

function settle(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig, reply: Reply | (() => Reply) = 200) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, request => {
		posts.push(request)
		const result = typeof reply === 'function' ? reply() : reply

		if (result === 'throw') {
			throw new Error('requester failed')
		}

		return result === 'reject'
			? Promise.reject(new Error('network'))
			: Promise.resolve({ status: result })
	})
	const lines = (index: number): string[] => (posts[index].body as string).split('\n')

	return { session, posts, lines }
}

function setupManual(config: CmcdSessionConfig) {
	const posts: HttpRequest[] = []
	const replies: ((status: number) => void)[] = []
	const session = createCmcdSession(
		{ sid: 's1', ...config },
		request =>
			new Promise(resolve => {
				posts.push(request)
				replies.push(status => resolve({ status }))
			}),
	)
	const lines = (index: number): string[] => (posts[index].body as string).split('\n')

	return { session, posts, replies, lines }
}

function setupSend(
	config: { events: CmcdEventType[]; batchSize?: number },
	reply: SendReply | (() => SendReply) = 'resolve',
) {
	const batches: Report[][] = []
	const send: CmcdEventSender = reports => {
		batches.push([...reports])
		const result = typeof reply === 'function' ? reply() : reply

		if (result === 'throw') {
			throw new Error('send failed')
		}

		if (result === 'reject') {
			return Promise.reject(new Error('transport'))
		}

		return Promise.resolve(result === 'gone' ? { gone: true } : undefined)
	}
	const session = createCmcdSession({ sid: 's1', eventTargets: [{ send, ...config }] })
	const lines = (index: number): string[] =>
		batches[index].map(report => encodeCmcd(report, { reportingMode: CmcdReportingMode.EVENT }))

	return { session, batches, lines }
}

describe('createCmcdSession delivery', () => {
	beforeEach(() => vi.useFakeTimers({ now: ts, toFake: ['setTimeout', 'clearTimeout', 'Date'] }))
	afterEach(() => vi.useRealTimers())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		const session = createCmcdSession(
			{
				eventTargets: [
					{
						url: 'https://collector.example.com/cmcd',
						events: [CmcdEventType.PLAY_STATE],
						batchSize: 10,
					},
				],
			},
			request => {
				bodies.push(request.body as string)
				return Promise.resolve({ status: 200 })
			},
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PAUSED })
		session.flush()

		equal(bodies.length, 1)
		equal(bodies[0].split('\n').length, 2)
		// #endregion example
	})

	it('sends at once when an e report joins the queue', () => {
		const { session, posts, lines } = setup({
			eventTargets: [
				{ url: A, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR], batchSize: 10 },
			],
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		equal(posts.length, 0)
		session.recordError('NET')

		equal(posts.length, 1)
		deepEqual(lines(0), [
			`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			`e=e,ec=("NET"),sid="s1",sn=1,ts=${ts},v=2`,
		])
	})

	it('drops a batch on a status other than 0, 2xx, 410, 429, or 5xx', async () => {
		const { session, posts } = setup(
			{ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] },
			404,
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		session.flush()
		vi.advanceTimersByTime(60_000)

		equal(posts.length, 1)
	})

	for (const reply of [0, 429, 500, 503, 'reject', 'throw'] as const) {
		it(`returns the batch to the queue after ${reply}, and waits 1 second, doubling to 60 seconds`, async () => {
			let current: Reply = reply
			const { session, posts, lines } = setup(
				{ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] }] },
				() => current,
			)

			const wait = async (ms: number, expected: number): Promise<void> => {
				vi.advanceTimersByTime(ms - 1)
				await settle()
				equal(posts.length, expected - 1)
				vi.advanceTimersByTime(1)
				await settle()
				equal(posts.length, expected)
			}

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordError('NET')
			equal(posts.length, 1)
			await wait(1000, 2)
			equal(lines(1).length, 3)

			let expected = 2
			for (const ms of [2000, 4000, 8000, 16_000, 32_000, 60_000, 60_000]) {
				await wait(ms, ++expected)
			}

			current = 200
			await wait(60_000, ++expected)
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			equal(posts.length, expected + 1)
		})
	}

	it('keeps every line while the collector fails', async () => {
		const { session, posts } = setup(
			{ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] },
			429,
		)

		for (let i = 0; i < 700; i++) {
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: i % 2 ? 'p' : 'a' })
		}
		await settle()
		session.flush()

		equal(posts.length, 2)
		equal((posts[1].body as string).split('\n').length, 700)
	})

	it('sends at once on flush() during a wait', async () => {
		const { session, posts } = setup(
			{ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] },
			503,
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		session.flush()

		equal(posts.length, 2)
	})

	it('sends after the response on flush() during a POST, also after a failure', async () => {
		const { session, posts, replies, lines } = setupManual({
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE], batchSize: 10 }],
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		session.flush()
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		session.flush()
		equal(posts.length, 1)
		replies[0](503)
		await settle()

		equal(posts.length, 2)
		deepEqual(lines(1), [
			`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
		])
	})

	it('stops only the target that received a 410, and drops its batch in flight', async () => {
		const { session, posts, replies } = setupManual({
			eventTargets: [
				{ url: A, events: [CmcdEventType.PLAY_STATE] },
				{ url: A, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] },
				{ url: B, events: [CmcdEventType.PLAY_STATE] },
			],
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		equal(posts.length, 3)
		replies[0](410)
		replies[1](503)
		replies[2](200)
		await settle()
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a', bs: true })
		session.recordError('NET')
		session.flush()
		vi.advanceTimersByTime(60_000)
		await settle()

		deepEqual(
			posts.map(post => post.url),
			[A, A, B, B, A],
		)
		equal(posts[3].body, `bs,e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`)
		deepEqual((posts[4].body as string).split('\n'), [
			`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			`bs,e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
			`e=e,ec=("NET"),sid="s1",sn=2,ts=${ts},v=2`,
		])
	})

	describe('send targets', () => {
		it('provides a valid example', () => {
			// #region example-send
			const records: { timestamp: number; line: string }[] = []
			const send: CmcdEventSender = reports => {
				records.push(
					...reports.map(report => ({
						timestamp: report.ts,
						line: encodeCmcd(report, { reportingMode: CmcdReportingMode.EVENT }),
					})),
				)
				return Promise.resolve()
			}
			const session = createCmcdSession({
				sid: 'session-1',
				eventTargets: [{ send, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] }],
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, {
				sta: CmcdPlayerState.PLAYING,
				ts: 1767225600000,
			})

			deepEqual(records, [
				{ timestamp: 1767225600000, line: 'e=ps,sid="session-1",sn=0,sta=p,ts=1767225600000,v=2' },
			])
			// #endregion example-send
		})

		it('calls send with the reports of a batch, oldest first, with e, sid, sn, ts, and v', () => {
			const { session, batches, lines } = setupSend({
				events: [CmcdEventType.PLAY_STATE],
				batchSize: 2,
			})

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bl: [1000] })
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })

			equal(batches.length, 1)
			deepEqual(lines(0), [
				`bl=(1000),e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
				`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
			])
			deepEqual(
				batches[0].map(report => [report.sid, report.sn, report.ts, report.v]),
				[
					['s1', 0, ts, 2],
					['s1', 1, ts, 2],
				],
			)
		})

		for (const reply of ['reject', 'throw'] as const) {
			it(`sends the batch again after a wait when send ${reply === 'reject' ? 'rejects' : 'throws'}`, async () => {
				let current: SendReply = reply
				const { session, batches } = setupSend(
					{ events: [CmcdEventType.PLAY_STATE] },
					() => current,
				)

				session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
				await settle()
				session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
				equal(batches.length, 1)
				vi.advanceTimersByTime(999)
				await settle()
				equal(batches.length, 1)
				vi.advanceTimersByTime(1)
				await settle()
				equal(batches.length, 2)
				equal(batches[1].length, 2)
				current = 'resolve'
				vi.advanceTimersByTime(2000)
				await settle()
				equal(batches.length, 3)
				session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

				equal(batches.length, 4)
			})
		}

		it('stops the target after a result with gone', async () => {
			const { session, batches } = setupSend(
				{ events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] },
				'gone',
			)

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
			session.recordError('NET')
			session.flush()
			vi.advanceTimersByTime(60_000)
			await settle()

			equal(batches.length, 1)
		})

		it('copies the nested values of a report when the report joins the queue', () => {
			const { session, lines } = setupSend({ events: [CmcdEventType.PLAY_STATE], batchSize: 2 })
			const params = { v: true }
			const item = toCmcdValue<number, { v: boolean }>(1000, params)
			const bl = [item]

			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bl })
			item.value = 5
			params.v = false
			bl.push(toCmcdValue(2))
			session.flush()

			deepEqual(lines(0), [`bl=(1000;v),e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})

		it('throws for a value that cannot be encoded, and keeps the sequence number', () => {
			const { session, lines } = setupSend({ events: [CmcdEventType.PLAY_STATE] })

			throws(() =>
				session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', 'com.example-name': 'a\nb' }),
			)
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

			deepEqual(lines(0), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
		})

		it('types a target with url or send, and the reports as deeply read-only', () => {
			const send: CmcdEventSender = reports => {
				// @ts-expect-error A send function cannot change a report.
				reports[0].sta = 'p'
				return Promise.resolve()
			}
			const targets: CmcdSessionEventReportConfig[] = [
				{ url: A, events: [] },
				{ send, events: [] },
				// @ts-expect-error A target has url or send, not both.
				{ url: A, send, events: [] },
				// @ts-expect-error A target needs url or send.
				{ events: [] },
			]

			ok(targets.length)
		})
	})
})
