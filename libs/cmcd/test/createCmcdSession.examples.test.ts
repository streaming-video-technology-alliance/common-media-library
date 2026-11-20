import type { Cmcd, CmcdKey, CmcdSessionConfig, CmcdSnapshot } from '@svta/cml-cmcd'
import {
	CmcdEventType,
	CmcdObjectType,
	CmcdPlayerState,
	CmcdStreamingFormat,
	CmcdStreamType,
	CmcdTransmissionMode,
	createCmcdSession,
	toCmcdValue,
} from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal } from 'node:assert'
import { afterEach, describe, it, vi } from 'vite-plus/test'
import {
	EX_8_1_1,
	EX_8_1_1_HEADERS,
	EX_8_1_2,
	EX_8_1_3,
	EX_8_1_4,
	EX_8_1_5,
	EX_8_1_6,
	EX_8_1_7,
	EX_8_1_8,
	EX_8_2_1,
	EX_8_2_2,
	EX_8_2_3,
	EX_8_2_4,
	EX_8_2_6,
	EX_8_2_7,
	EX_8_2_8,
} from './data/CTA_5004_B_EXAMPLES.ts'

const CDN = 'https://cdn.example.com'
const SEGMENT = `${CDN}/seg-1.m4s`
const COLLECTOR = 'https://collector.example.com/cmcd'
const CID = 'content-id-123'
const SID = 'session-id-123'

function query(url: string): string {
	return url.slice(url.indexOf('?') + 1)
}

function settle(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

function eventSetup(config: CmcdSessionConfig) {
	const bodies: string[] = []
	const session = createCmcdSession({ sid: SID, ...config }, (request: HttpRequest) => {
		bodies.push(request.body as string)
		return Promise.resolve({ status: 200 })
	})

	return { session, bodies }
}

const v = (value: number) => toCmcdValue<number, { v: boolean }>(value, { v: true })
const a = (value: number) => toCmcdValue<number, { a: boolean }>(value, { a: true })
const NO_SN: CmcdKey[] = [
	'bl',
	'br',
	'bs',
	'cid',
	'cmsdd',
	'cmsds',
	'd',
	'dl',
	'e',
	'ec',
	'h',
	'msd',
	'mtp',
	'nor',
	'nr',
	'ot',
	'pt',
	'rc',
	'rtp',
	'sf',
	'sid',
	'st',
	'sta',
	'su',
	'tb',
	'ts',
	'ttfb',
	'ttlb',
	'url',
	'v',
]

describe('createCmcdSession reproduces the examples of CTA-5004-B', () => {
	afterEach(() => vi.useRealTimers())

	it('provides a valid example', () => {
		// #region example
		const session = createCmcdSession({ sid: 'session-id-123', enabledKeys: ['cid', 'sid'] })

		const report = session.createRequestReport(
			{ url: 'https://cdn.example.com/seg-1.m4s' },
			{ cid: 'content-id-123' },
		)

		equal(
			decodeURIComponent(report.url),
			'https://cdn.example.com/seg-1.m4s?CMCD=cid="content-id-123",sid="session-id-123",v=2',
		)
		// #endregion example
	})

	describe('8.1 request mode', () => {
		const data81: Cmcd = {
			cid: CID,
			sf: CmcdStreamingFormat.DASH,
			st: CmcdStreamType.VOD,
			sta: CmcdPlayerState.PLAYING,
			bl: [2000],
			mtp: [15000],
			rtp: 12000,
			br: [v(3000)],
			d: 4000,
			dl: 1000,
			nor: [`${CDN}/next-seg.mp4`],
			ot: CmcdObjectType.VIDEO,
			tb: [v(6000)],
		}
		const keys81: CmcdKey[] = [
			'bl',
			'br',
			'cid',
			'd',
			'dl',
			'mtp',
			'nor',
			'ot',
			'rtp',
			'sf',
			'sid',
			'st',
			'sta',
			'tb',
		]

		it('8.1.1 in query mode', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: keys81 })

			equal(query(session.createRequestReport({ url: SEGMENT }, data81).url), EX_8_1_1)
		})

		it('8.1.1 in header mode', () => {
			const session = createCmcdSession({
				sid: SID,
				enabledKeys: keys81,
				transmissionMode: CmcdTransmissionMode.HEADERS,
			})

			deepEqual(
				session.createRequestReport({ url: SEGMENT, headers: { Accept: '*/*' } }, data81).headers,
				{ Accept: '*/*', ...EX_8_1_1_HEADERS },
			)
		})

		it('8.1.2 and 8.1.3', () => {
			const audio = createCmcdSession({
				sid: SID,
				enabledKeys: ['bl', 'br', 'cid', 'd', 'mtp', 'ot', 'sid', 'st'],
			})
			const minimal = createCmcdSession({ sid: SID, enabledKeys: ['cid', 'sid'] })

			equal(
				query(
					audio.createRequestReport(
						{ url: SEGMENT },
						{
							cid: CID,
							st: CmcdStreamType.VOD,
							bl: [2000],
							mtp: [15000],
							br: [320],
							d: 2000,
							ot: CmcdObjectType.AUDIO,
						},
					).url,
				),
				EX_8_1_2,
			)
			equal(query(minimal.createRequestReport({ url: SEGMENT }, { cid: CID }).url), EX_8_1_3)
		})

		it('8.1.4, a startup sequence with su and msd', () => {
			const session = createCmcdSession({
				sid: SID,
				enabledKeys: [
					'bl',
					'br',
					'cid',
					'd',
					'msd',
					'mtp',
					'nor',
					'ot',
					'sf',
					'sid',
					'st',
					'sta',
					'su',
				],
			})
			const base: Cmcd = { cid: CID, st: CmcdStreamType.VOD }
			const media: Cmcd = {
				...base,
				bl: [0],
				br: [v(3000)],
				mtp: [15000],
				sta: CmcdPlayerState.STARTING,
				su: true,
			}

			const urls = [
				session.createRequestReport(
					{ url: `${CDN}/manifest.mpd` },
					{ ...base, ot: CmcdObjectType.MANIFEST, sf: CmcdStreamingFormat.DASH, su: true },
				).url,
				session.createRequestReport(
					{ url: `${CDN}/init.m4v` },
					{ ...media, ot: CmcdObjectType.INIT, nor: [`${CDN}/seg-1.m4v`, `${CDN}/seg-2.m4v`] },
				).url,
				session.createRequestReport(
					{ url: `${CDN}/seg-1.m4v` },
					{
						...media,
						ot: CmcdObjectType.VIDEO,
						d: 4000,
						nor: [`${CDN}/seg-2.m4v`, `${CDN}/seg-3.m4v`],
					},
				).url,
				session.createRequestReport(
					{ url: `${CDN}/seg-2.m4v` },
					{
						...media,
						bl: [4000],
						sta: CmcdPlayerState.PLAYING,
						su: false,
						msd: 200,
						ot: CmcdObjectType.VIDEO,
						d: 4000,
						nor: [`${CDN}/seg-3.m4v`, `${CDN}/seg-4.m4v`],
					},
				).url,
			]

			deepEqual(urls.map(query), EX_8_1_4)
		})

		it('8.1.5, error codes that wait for the next request', () => {
			const session = createCmcdSession({ sid: SID, enabledKeys: ['cid', 'ec', 'sid', 'sta'] })

			session.recordError('CODEC_NOT_SUPPORTED')
			const first = session.createRequestReport(
				{ url: SEGMENT },
				{ cid: CID, sta: CmcdPlayerState.PLAYING },
			)
			const second = session.createRequestReport(
				{ url: SEGMENT },
				{ cid: CID, sta: CmcdPlayerState.PLAYING },
			)
			session.recordError(['DRM_NOT_SUPPORTED', 'PLAYBACK_FAILED'])
			const third = session.createRequestReport({ url: SEGMENT }, { cid: CID, sta: 'f' })

			deepEqual(
				[first, third].map(report => query(report.url)),
				EX_8_1_5,
			)
			equal(
				query(second.url),
				'CMCD=cid%3D%22content-id-123%22%2Csid%3D%22session-id-123%22%2Csta%3Dp%2Cv%3D2',
			)
		})

		it('8.1.6, buffer starvation', () => {
			const session = createCmcdSession({
				sid: SID,
				enabledKeys: ['bl', 'bs', 'cid', 'ot', 'sid', 'sta'],
			})
			const stall: Cmcd = {
				cid: CID,
				sta: CmcdPlayerState.REBUFFERING,
				ot: CmcdObjectType.VIDEO,
				bs: true,
			}

			const urls = [
				session.createRequestReport({ url: SEGMENT }, { ...stall, bl: [0] }).url,
				session.createRequestReport({ url: SEGMENT }, { ...stall, bl: [v(0), a(2000)] }).url,
			]

			deepEqual(urls.map(query), EX_8_1_6)
		})

		it('8.1.7, two players in one session', () => {
			const session = createCmcdSession({
				sid: 'session-common-1',
				enabledKeys: ['cid', 'nr', 'ot', 'sid'],
			})
			const report = (data: Cmcd): string =>
				query(
					session.createRequestReport({ url: SEGMENT }, { ...data, ot: CmcdObjectType.VIDEO }).url,
				)

			deepEqual(
				{
					primary: report({ cid: 'movie-123' }),
					ad: report({ cid: 'ad-555', nr: true }),
					primaryHidden: report({ cid: 'movie-123', nr: true }),
					adShown: report({ cid: 'ad-555' }),
				},
				EX_8_1_7,
			)
		})

		it('8.1.8, every request mode key', () => {
			const session = createCmcdSession({ sid: SID })

			session.recordError('2001')
			const report = session.createRequestReport(
				{ url: SEGMENT },
				{
					bg: true,
					bl: [v(2100), a(1800)],
					br: [v(3000), a(164)],
					bs: true,
					bsa: [v(3)],
					bsd: [v(1200), a(100)],
					bsda: [v(4150), a(300)],
					cid: CID,
					cs: 'g48djn236sk2',
					d: 4000,
					dfa: 32,
					dl: 1000,
					lb: [v(500), a(32)],
					ltc: 13500,
					msd: 1700,
					mtp: [v(15000), a(6000)],
					nor: [`${CDN}/next-seg.mp4`],
					nr: true,
					ot: CmcdObjectType.VIDEO,
					pb: [v(2000), a(164)],
					pr: 1.1,
					pt: 632782,
					rtp: 12000,
					sf: CmcdStreamingFormat.DASH,
					st: CmcdStreamType.LIVE,
					sta: CmcdPlayerState.PLAYING,
					su: true,
					tb: [v(6000), a(350)],
					tbl: [v(2000), a(2000)],
					tpb: [v(5000), a(164)],
				},
			)

			equal(query(report.url), EX_8_1_8)
		})
	})

	describe('8.2 event mode', () => {
		it('8.2.1, a minimal t report', () => {
			vi.useFakeTimers({
				now: 1764752400000 - 30_000,
				toFake: ['setInterval', 'clearInterval', 'Date'],
			})
			const { session, bodies } = eventSetup({
				eventTargets: [{ url: COLLECTOR, events: [CmcdEventType.TIME_INTERVAL], enabledKeys: [] }],
				snapshot: () => ({}),
			})

			session.start(false)
			vi.advanceTimersByTime(30_000)
			session.stop()

			deepEqual(bodies, [EX_8_2_1])
		})

		it('8.2.2, t reports with msd, a stall, and an error between two reports', async () => {
			vi.useFakeTimers({
				now: 1764752400000 - 30_000,
				toFake: ['setInterval', 'clearInterval', 'Date'],
			})
			const media: CmcdSnapshot = {
				cid: CID,
				h: 'example.com',
				sf: CmcdStreamingFormat.DASH,
				st: CmcdStreamType.VOD,
				br: [v(4200), a(256)],
				lb: [v(523), a(64)],
				pb: [v(4200), a(256)],
				tb: [v(4200), a(256)],
				tpb: [v(4200), a(256)],
			}
			const snapshots: CmcdSnapshot[] = [
				{ cid: CID },
				{ cid: CID, h: 'example.com', bl: [0], pt: 0, sta: CmcdPlayerState.STARTING, su: true },
				{
					...media,
					bl: [6000],
					msd: 812,
					mtp: [v(87000), a(49000)],
					pt: 29188,
					sta: CmcdPlayerState.PLAYING,
				},
				{
					...media,
					bl: [3200],
					mtp: [v(89000), a(52000)],
					pt: 59188,
					sta: CmcdPlayerState.PLAYING,
				},
				{
					...media,
					bl: [6000],
					mtp: [v(81000), a(55000)],
					pt: 89188,
					sta: CmcdPlayerState.PLAYING,
				},
				{ ...media, bl: [0], mtp: [v(82000), a(55000)], pr: 0, pt: 111000, sta: 'e' },
			]
			let tick = 0
			const { session, bodies } = eventSetup({
				eventTargets: [{ url: COLLECTOR, events: [CmcdEventType.TIME_INTERVAL] }],
				snapshot: () => snapshots[tick++],
			})

			session.start()
			for (let i = 1; i < snapshots.length; i++) {
				await settle()
				if (i === 3) {
					session.recordError('MEDIA_ERR_NETWORK')
					session.createRequestReport(
						{ url: SEGMENT },
						{ ot: CmcdObjectType.VIDEO, bs: true, bsd: [v(720)] },
					)
				}
				vi.advanceTimersByTime(30_000)
			}
			session.stop()

			deepEqual(bodies.slice(1), EX_8_2_2)
		})

		it('8.2.3, an rr report with CMSD keys', () => {
			const { session, bodies } = eventSetup({
				sid: 'session1',
				enabledKeys: NO_SN,
				eventTargets: [
					{
						url: COLLECTOR,
						events: [CmcdEventType.RESPONSE_RECEIVED],
						enabledKeys: [...NO_SN, 'cmsdd', 'cmsds'],
					},
				],
			})

			const request = session.createRequestReport(
				{ url: 'video/segment-5.m4v' },
				{ cid: 'bbb', ot: CmcdObjectType.VIDEO, nor: ['video/segment-6.m4v'] },
			)
			session.recordResponseReceived(
				{
					request,
					status: 200,
					resourceTiming: {
						startTime: 1000,
						responseStart: 1180,
						duration: 200,
						encodedBodySize: 0,
					},
				},
				{
					ts: 1763657019723,
					cmsdd: 'ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==',
					cmsds: 'c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==',
				},
			)

			deepEqual(bodies, [EX_8_2_3])
		})

		it('8.2.4, 8.2.6, and 8.2.7, error, play state, and skip reports', async () => {
			const { session, bodies } = eventSetup({
				eventTargets: [
					{
						url: COLLECTOR,
						events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE, CmcdEventType.SKIP],
						enabledKeys: NO_SN,
					},
				],
			})

			session.recordError('CODEC_NOT_SUPPORTED', { cid: CID, ts: 1764269150213 })
			await settle()
			session.recordEvent(CmcdEventType.PLAY_STATE, {
				cid: CID,
				bl: [0],
				pt: 30000,
				sta: CmcdPlayerState.SEEKING,
				ts: 1764269150529,
			})
			await settle()
			session.recordEvent(CmcdEventType.SKIP, { cid: 'ad-content-555', ts: 1764269150076 })

			deepEqual(bodies, [EX_8_2_4, EX_8_2_6, EX_8_2_7])
		})

		it('8.2.8, an ad break', async () => {
			const { session, bodies } = eventSetup({
				eventTargets: [
					{
						url: COLLECTOR,
						events: [
							CmcdEventType.AD_BREAK_START,
							CmcdEventType.AD_START,
							CmcdEventType.AD_END,
							CmcdEventType.AD_BREAK_END,
						],
						enabledKeys: NO_SN,
					},
				],
			})

			session.recordEvent(CmcdEventType.AD_BREAK_START, {
				cid: 'movie-123',
				nr: true,
				ts: 1764269150186,
			})
			await settle()
			session.recordEvent(CmcdEventType.AD_START, { cid: 'ad-001', ts: 1764269150934 })
			await settle()
			session.recordEvent(CmcdEventType.AD_END, { cid: 'ad-001', nr: true, ts: 1764269170901 })
			await settle()
			session.recordEvent(CmcdEventType.AD_BREAK_END, { cid: 'movie-123', ts: 1764269170331 })

			deepEqual(bodies, EX_8_2_8)
		})
	})
})
