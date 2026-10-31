import type { CmcdSessionConfig, CmcdSnapshot } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, CmcdStreamType, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, vi } from 'vite-plus/test'

const A = 'https://a.test/cmcd'
const B = 'https://b.test/cmcd'
const ts = 1000

function settle(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

function setup(config: CmcdSessionConfig, status = 200) {
	const posts: HttpRequest[] = []
	const session = createCmcdSession({ sid: 's1', ...config }, request => {
		posts.push(request)
		return Promise.resolve({ status })
	})
	const lines = (index: number): string[] => (posts[index].body as string).split('\n')

	return { session, posts, lines }
}

describe('createCmcdSession timers', () => {
	const state: CmcdSnapshot = { sta: 'p' }

	beforeEach(() =>
		vi.useFakeTimers({
			now: ts,
			toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
		}),
	)
	afterEach(() => vi.useRealTimers())

	it('provides a valid example', () => {
		// #region example
		const bodies: string[] = []
		let playerState: CmcdPlayerState = CmcdPlayerState.STARTING

		const data = (): CmcdSnapshot => ({ st: CmcdStreamType.VOD, sta: playerState, bl: [21300] })

		const session = createCmcdSession(
			{
				cid: 'movie-42',
				eventTargets: [
					{
						url: 'https://collector.example.com/cmcd',
						events: [CmcdEventType.PLAY_STATE, CmcdEventType.TIME_INTERVAL],
						interval: 30,
						batchSize: 2,
					},
				],
				snapshot: data,
			},
			request => {
				bodies.push(request.body as string)
				return Promise.resolve({ status: 200 })
			},
		)

		function setPlayerState(next: CmcdPlayerState): void {
			if (next === playerState) {
				return
			}

			playerState = next
			session.recordEvent(CmcdEventType.PLAY_STATE, data())
		}

		session.start()
		setPlayerState(CmcdPlayerState.PLAYING)
		setPlayerState(CmcdPlayerState.PLAYING)
		session.stop()

		const [interval, playing] = bodies[0].split('\n')
		ok(interval.includes('e=t') && interval.includes('sta=s'))
		ok(playing.includes('e=ps') && playing.includes('sta=p'))
		// #endregion example
	})

	it('sends the first t report on start() and one each interval, until stop()', async () => {
		const { session, posts, lines } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }],
			snapshot: () => state,
		})

		session.start()
		equal(posts.length, 1)
		await settle()
		vi.advanceTimersByTime(9999)
		equal(posts.length, 1)
		vi.advanceTimersByTime(1)
		equal(posts.length, 2)
		session.stop()
		vi.advanceTimersByTime(60_000)

		equal(posts.length, 2)
		deepEqual(lines(1), [`e=t,sid="s1",sn=1,sta=p,ts=${ts + 10_000},v=2`])
	})

	it('waits one interval on start(false), and uses CMCD_DEFAULT_TIME_INTERVAL without an interval', () => {
		const { session, posts } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL] }],
			snapshot: () => state,
		})

		session.start(false)
		vi.advanceTimersByTime(29_999)
		equal(posts.length, 0)
		vi.advanceTimersByTime(1)

		equal(posts.length, 1)
	})

	it('arms no timer without snapshot, for an interval of 0, or for a target without t', () => {
		const first = setup({ eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL] }] })
		const second = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 0 }],
			snapshot: () => state,
		})
		const third = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
			snapshot: () => state,
		})

		for (const { session } of [first, second, third]) {
			session.start()
		}
		vi.advanceTimersByTime(60_000)

		equal(first.posts.length + second.posts.length + third.posts.length, 0)
	})

	it('ticks each target at its own interval and applies its filter', async () => {
		const data: CmcdSnapshot = { sta: 'p' }
		const { session, posts } = setup({
			eventTargets: [
				{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 },
				{
					url: B,
					events: [CmcdEventType.TIME_INTERVAL],
					interval: 15,
					filter: report => report.sta === 'a',
				},
			],
			snapshot: () => data,
		})

		session.start(false)
		vi.advanceTimersByTime(10_000)
		await settle()
		data.sta = 'a'
		vi.advanceTimersByTime(5000)
		vi.advanceTimersByTime(5000)

		deepEqual(
			posts.map(post => post.url),
			[A, B, A],
		)
	})

	it('arms one timer for each target when start() runs twice', () => {
		const { session, posts } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }],
			snapshot: () => state,
		})

		session.start(false)
		session.start(false)
		vi.advanceTimersByTime(10_000)

		equal(posts.length, 1)
	})

	it('gives an error of snapshot() to the timer callback', () => {
		const { session } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }],
			snapshot: () => {
				throw new Error('snapshot failed')
			},
		})

		session.start(false)

		throws(() => vi.advanceTimersByTime(10_000), /snapshot failed/)
		session.stop()
	})

	it('ignores bs and bsd in the data of snapshot()', () => {
		const stall = { sta: CmcdPlayerState.REBUFFERING, bs: true, bsd: [1200] }
		const { session, lines } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.TIME_INTERVAL], interval: 10 }],
			// @ts-expect-error - CmcdSnapshot rejects bs and bsd. A JavaScript caller can still return them.
			snapshot: () => stall,
		})

		session.start()
		session.stop()
		const report = session.createRequestReport({ url: 'https://cdn.test/v/1.m4s' })

		deepEqual(lines(0), [`e=t,sid="s1",sn=0,sta=r,ts=${ts},v=2`])
		equal(decodeURIComponent(report.url), 'https://cdn.test/v/1.m4s?CMCD=sid="s1",sn=0,v=2')
	})

	it('clears the wait on stop(), and a failure after stop() starts no timer', async () => {
		const { session, posts } = setup(
			{ eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }] },
			503,
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		session.stop()
		vi.advanceTimersByTime(300_000)
		await settle()
		equal(posts.length, 1)
		session.flush()
		await settle()
		vi.advanceTimersByTime(300_000)
		await settle()

		equal(posts.length, 2)
	})
})
