import type { Cmcd, CmcdSessionConfig } from '@svta/cml-cmcd'
import {
	CmcdEventType,
	CmcdObjectType,
	CmcdPlayerState,
	createCmcdSession,
	toCmcdValue,
} from '@svta/cml-cmcd'
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
	const request = (data: Cmcd): string =>
		decodeURIComponent(session.createRequestReport({ url: SEGMENT }, data).url)

	return { session, lines, request }
}

describe('createCmcdSession errors and keys with a destination scope', () => {
	beforeEach(() => vi.useFakeTimers({ now: ts, toFake: ['Date'] }))
	afterEach(() => vi.useRealTimers())

	it('provides a valid example', () => {
		// #region example
		const posts: { url: string; body: string }[] = []
		const session = createCmcdSession(
			{
				sid: 'session-1',
				eventTargets: [
					{ url: 'https://collector.example.com/errors', events: [CmcdEventType.ERROR] },
					{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.PLAY_STATE] },
				],
			},
			request => {
				posts.push({ url: request.url, body: request.body as string })
				return Promise.resolve({ status: 200 })
			},
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, msd: 850 })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.REBUFFERING, bs: true })
		session.recordError('MEDIA_ERR_NETWORK')
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, bsd: [1200] })

		const report = session.createRequestReport(
			{ url: 'https://cdn.example.com/movie/seg-4.m4s' },
			{ ot: CmcdObjectType.VIDEO, d: 4000 },
		)

		const error = posts.find(post => post.url === 'https://collector.example.com/errors')
		ok(error?.body.startsWith('bs,e=e,ec=("MEDIA_ERR_NETWORK"),msd=850,'))
		equal(
			decodeURIComponent(report.url),
			'https://cdn.example.com/movie/seg-4.m4s?CMCD=bs,bsd=(1200),d=4000,ec=("MEDIA_ERR_NETWORK"),msd=850,ot=v,sid="session-1",sn=0,v=2',
		)
		// #endregion example
	})

	it('sends msd from any call once to each destination, and ignores an invalid msd', async () => {
		const { session, lines, request } = setup({
			eventTargets: [
				{ url: A, events: [CmcdEventType.PLAY_STATE] },
				{ url: B, events: [CmcdEventType.PLAY_STATE] },
			],
		})

		for (const msd of [-5, Number.NaN, Infinity, 1e15]) {
			session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 's', msd })
		}
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', msd: 850.6 })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a', msd: 900 })
		const first = request({ ot: CmcdObjectType.VIDEO, msd: 900 })
		const second = request({ ot: CmcdObjectType.VIDEO })
		await settle()

		deepEqual(
			lines().filter(line => line.includes('msd')),
			[
				`e=ps,msd=851,sid="s1",sn=4,sta=p,ts=${ts},v=2`,
				`e=ps,msd=851,sid="s1",sn=4,sta=p,ts=${ts},v=2`,
			],
		)
		ok(first.includes('msd=851'))
		ok(!second.includes('msd'))
	})

	it('rounds msd, and accepts values from 0 to the integer limit', () => {
		const cases: [number, string][] = [
			[0, 'msd=0'],
			[12.5, 'msd=13'],
			[999_999_999_999_999, 'msd=999999999999999'],
			[999_999_999_999_998.6, 'msd=999999999999999'],
		]

		for (const [msd, expected] of cases) {
			const { request } = setup({})
			ok(request({ msd }).includes(expected))
		}
	})

	it('keeps msd for the next report that can carry it', () => {
		const { session, request } = setup({ version: 1 })

		const first = request({ msd: 300 })
		session.configure({ version: 2 })
		const second = request({})

		ok(!first.includes('msd'))
		ok(second.includes('msd=300'))
	})

	it('sends a waiting bs with the next report of the same object type', async () => {
		const { session, lines, request } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'r', ot: CmcdObjectType.VIDEO, bs: true })
		const audio = request({ ot: CmcdObjectType.AUDIO })
		const video = request({ ot: CmcdObjectType.VIDEO })
		const again = request({ ot: CmcdObjectType.VIDEO })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		request({ bs: true })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		await settle()

		equal(audio, `${SEGMENT}?CMCD=ot=a,sid="s1",sn=0,v=2`)
		equal(video, `${SEGMENT}?CMCD=bs,ot=v,sid="s1",sn=1,v=2`)
		equal(again, `${SEGMENT}?CMCD=ot=v,sid="s1",sn=2,v=2`)
		deepEqual(lines(), [
			`bs,e=ps,ot=v,sid="s1",sn=0,sta=r,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=p,ts=${ts},v=2`,
			`bs,e=ps,sid="s1",sn=2,sta=a,ts=${ts},v=2`,
		])
	})

	it('sends the bsd values of several calls to a destination as one list', async () => {
		const { session, lines, request } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
		})

		const first = request({ bsd: [1200] })
		const second = request({ bsd: [800] })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		await settle()

		equal(first, `${SEGMENT}?CMCD=bsd=(1200),sid="s1",sn=0,v=2`)
		equal(second, `${SEGMENT}?CMCD=bsd=(800),sid="s1",sn=1,v=2`)
		deepEqual(lines(), [
			`bsd=(1200 800),e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
		])
	})

	it('copies each waiting value, including the value inside an SfItem', () => {
		const { session, lines, request } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
		})
		const params = { v: true }
		const item = toCmcdValue<number, { v: boolean }>(1200, params)
		const bsd = [item, 800]

		request({ bsd })
		item.value = 5
		params.v = false
		bsd.push(1)
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

		deepEqual(lines(), [`bsd=(1200;v 800),e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
	})

	it('sends an e report to the targets that list e, and the codes wait for every other destination', async () => {
		const { session, lines, request } = setup({
			eventTargets: [
				{ url: A, events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE] },
				{ url: B, events: [CmcdEventType.PLAY_STATE] },
			],
		})

		const stall = request({ bs: true })
		session.recordError('NET')
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		const first = request({})
		const second = request({})
		await settle()

		equal(stall, `${SEGMENT}?CMCD=bs,sid="s1",sn=0,v=2`)
		equal(first, `${SEGMENT}?CMCD=ec=("NET"),sid="s1",sn=1,v=2`)
		equal(second, `${SEGMENT}?CMCD=sid="s1",sn=2,v=2`)
		deepEqual(lines(A), [
			`bs,e=e,ec=("NET"),sid="s1",sn=0,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=p,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=2,sta=a,ts=${ts},v=2`,
		])
		deepEqual(lines(B), [
			`bs,e=ps,ec=("NET"),sid="s1",sn=0,sta=p,ts=${ts},v=2`,
			`e=ps,sid="s1",sn=1,sta=a,ts=${ts},v=2`,
		])
	})

	it('changes no state when a call throws', () => {
		const { session, lines, request } = setup({
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
		})

		throws(() =>
			session.recordEvent(CmcdEventType.PLAY_STATE, {
				sta: 'p',
				bs: true,
				msd: 500,
				'com.example-name': 'a\nb',
			}),
		)
		throws(() => request({ bsd: [1e18] }))
		throws(() => session.recordError('a\nb'))
		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

		equal(request({}), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
		deepEqual(lines(), [`e=ps,sid="s1",sn=0,sta=p,ts=${ts},v=2`])
	})

	it('drops a waiting value that the version or enabledKeys does not allow', () => {
		const { session, request } = setup({
			version: 1,
			eventTargets: [{ url: A, events: [CmcdEventType.PLAY_STATE] }],
		})

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bsd: [300] })
		const first = request({})
		session.configure({ version: 2 })
		const second = request({})

		equal(first, `${SEGMENT}?CMCD=sid="s1"`)
		equal(second, `${SEGMENT}?CMCD=sid="s1",sn=1,v=2`)
	})
})
