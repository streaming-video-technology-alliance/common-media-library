import type { Cmcd } from '@svta/cml-cmcd'
import {
	CmcdHeaderField,
	CmcdObjectType,
	CmcdTransmissionMode,
	createCmcdSession,
} from '@svta/cml-cmcd'
import { deepEqual, equal, notEqual, ok, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

const SEGMENT = 'https://cdn.test/v/1.m4s'

describe('createCmcdSession', () => {
	it('provides a valid example', () => {
		// #region example
		const session = createCmcdSession({ sid: 'session-1', cid: 'movie-42' })

		const report = session.createRequestReport(
			{ url: 'https://cdn.example.com/movie/seg-1.m4s' },
			{ ot: CmcdObjectType.VIDEO, d: 4000, br: [3000] },
		)

		equal(
			decodeURIComponent(report.url),
			'https://cdn.example.com/movie/seg-1.m4s?CMCD=br=(3000),cid="movie-42",d=4000,ot=v,sid="session-1",sn=0,v=2',
		)
		// #endregion example
	})

	describe('createRequestReport', () => {
		it('numbers the reports from 0 and adds sid, the configured cid, and v', () => {
			const session = createCmcdSession({ sid: 's1', cid: 'c1' })

			const first = session.createRequestReport({ url: SEGMENT })
			const second = session.createRequestReport({ url: SEGMENT }, { cid: 'ad-7' })

			equal(decodeURIComponent(first.url), `${SEGMENT}?CMCD=cid="c1",sid="s1",sn=0,v=2`)
			equal(decodeURIComponent(second.url), `${SEGMENT}?CMCD=cid="ad-7",sid="s1",sn=1,v=2`)
		})

		it('ignores sid and sn in the data', () => {
			const session = createCmcdSession({ sid: 's1' })

			// @ts-expect-error - The data type leaves out sid and sn. A JavaScript caller can still pass them.
			const report = session.createRequestReport({ url: SEGMENT }, { sid: 'other', sn: 99 })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
		})

		it('generates a sid when the configuration has none', () => {
			const session = createCmcdSession()

			ok(/^[0-9a-f-]{36}$/.test(session.sid))
			ok(
				decodeURIComponent(session.createRequestReport({ url: SEGMENT }).url).includes(
					`sid="${session.sid}"`,
				),
			)
		})

		it('replaces the first CMCD parameter in place and keeps the fragment', () => {
			const session = createCmcdSession({ sid: 's1' })

			const report = session.createRequestReport({ url: `${SEGMENT}?CMCD=sn%3D9&a=1&CMCD=x#t=5` })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2&a=1#t=5`)
		})

		it('writes nor as a path relative to the request URL', () => {
			const session = createCmcdSession({ sid: 's1' })

			const report = session.createRequestReport(
				{ url: SEGMENT },
				{ nor: ['https://cdn.test/v/2.m4s'] },
			)

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=nor=("2.m4s"),sid="s1",sn=0,v=2`)
		})

		it('returns a copy of the request, with the report data in customData.cmcd', () => {
			const session = createCmcdSession({ sid: 's1' })
			const request = {
				url: SEGMENT,
				headers: { Range: 'bytes=0-99' },
				customData: { requestType: 'segment' },
			}

			const report = session.createRequestReport(request, { ot: CmcdObjectType.VIDEO })

			equal(request.url, SEGMENT)
			deepEqual(request.customData, { requestType: 'segment' })
			notEqual(report.headers, request.headers)
			deepEqual(report.headers, { Range: 'bytes=0-99' })
			const customData = report.customData as { requestType: string; cmcd: Cmcd }
			equal(customData.requestType, 'segment')
			equal(customData.cmcd.sid, 's1')
			equal(customData.cmcd.sn, 0)
		})

		it('sends CMCD headers in header mode and replaces the existing ones', () => {
			const session = createCmcdSession({
				sid: 's1',
				transmissionMode: CmcdTransmissionMode.HEADERS,
			})
			const request = {
				url: SEGMENT,
				headers: { 'cmcd-status': 'bs', [CmcdHeaderField.REQUEST]: 'bl=(100)', Accept: '*/*' },
			}

			const report = session.createRequestReport(request, { ot: CmcdObjectType.VIDEO, bl: [5000] })

			equal(report.url, SEGMENT)
			deepEqual(report.headers, {
				Accept: '*/*',
				'CMCD-Object': 'ot=v',
				'CMCD-Request': 'bl=(5000),sn=0',
				'CMCD-Session': 'sid="s1",v=2',
			})
		})

		it('places custom keys with customHeaderMap', () => {
			const session = createCmcdSession({
				sid: 's1',
				transmissionMode: CmcdTransmissionMode.HEADERS,
				customHeaderMap: { [CmcdHeaderField.OBJECT]: ['com.example-a'] },
			})

			const report = session.createRequestReport({ url: SEGMENT }, { 'com.example-a': 'x' })

			equal(report.headers[CmcdHeaderField.OBJECT], 'com.example-a="x"')
		})

		it('encodes version 1 without sn and without the version 2 keys', () => {
			const session = createCmcdSession({ sid: 's1', version: 1 })

			const report = session.createRequestReport(
				{ url: SEGMENT },
				{ ot: CmcdObjectType.VIDEO, bl: [5000], msd: 300, sta: 'p' },
			)

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=bl=5000,ot=v,sid="s1"`)
		})

		it('keeps only the enabled keys, and v', () => {
			const session = createCmcdSession({ sid: 's1', enabledKeys: ['sid', 'br'] as const })

			const report = session.createRequestReport({ url: SEGMENT }, { br: [3000], d: 4000 })

			equal(decodeURIComponent(report.url), `${SEGMENT}?CMCD=br=(3000),sid="s1",v=2`)
		})

		it('throws for a value that cannot be encoded, and keeps the sequence number', () => {
			const session = createCmcdSession({ sid: 's1' })

			throws(() => session.createRequestReport({ url: SEGMENT }, { 'com.example-key': 'a\nb' }))

			equal(
				decodeURIComponent(session.createRequestReport({ url: SEGMENT }).url),
				`${SEGMENT}?CMCD=sid="s1",sn=0,v=2`,
			)
		})
	})

	describe('configure', () => {
		it('replaces the request settings and keeps the sequence number', () => {
			const session = createCmcdSession({ sid: 's1' })

			const first = session.createRequestReport({ url: SEGMENT })
			session.configure({ version: 1, enabledKeys: ['sid'] })
			const second = session.createRequestReport({ url: SEGMENT })
			session.configure({
				version: 2,
				enabledKeys: undefined,
				transmissionMode: CmcdTransmissionMode.HEADERS,
			})
			const third = session.createRequestReport({ url: SEGMENT })

			equal(decodeURIComponent(first.url), `${SEGMENT}?CMCD=sid="s1",sn=0,v=2`)
			equal(decodeURIComponent(second.url), `${SEGMENT}?CMCD=sid="s1"`)
			equal(third.url, SEGMENT)
			equal(third.headers[CmcdHeaderField.REQUEST], 'sn=2')
		})
	})
})
