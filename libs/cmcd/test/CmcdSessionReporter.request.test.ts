import { CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_1_1, EX_8_1_1_HEADERS, EX_8_1_2, EX_8_1_3, EX_8_1_5, EX_8_1_6, EX_8_1_7, EX_8_1_8 } from './data/CTA_5004_B_EXAMPLES.ts'
import { queryValue } from './helpers/cmcdSessionHarness.ts'

const SEGMENT = 'https://cdn.example.com/seg-1.m4s'

describe('CmcdSessionReporter request mode', () => {
	it('reproduces 8.1.1 in query mode', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'br', 'cid', 'd', 'dl', 'mtp', 'nor', 'ot', 'rtp', 'sf', 'sid', 'st', 'sta', 'tb'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sf: 'd', st: 'v', sta: 'p', bl: 2000, mtp: 15000, rtp: 12000 })
		const req = reporter.decorate({ url: SEGMENT }, { br: { v: 3000 }, d: 4000, dl: 1000, nor: 'https://cdn.example.com/next-seg.mp4', ot: 'v', tb: { v: 6000 } })
		equal(queryValue(req.url), EX_8_1_1)
		equal(req.url.startsWith(`${SEGMENT}?CMCD=`), true)
		equal(req.cmcd.sid, 'session-id-123')
		equal(req.cmcd.data.d, 4000)
	})

	it('reproduces 8.1.1 in header mode', () => {
		const session = createCmcdSession({ sid: 'session-id-123', transmissionMode: CmcdTransmissionMode.HEADERS, keys: ['bl', 'br', 'cid', 'd', 'dl', 'mtp', 'nor', 'ot', 'rtp', 'sf', 'sid', 'st', 'sta', 'tb'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sf: 'd', st: 'v', sta: 'p', bl: 2000, mtp: 15000, rtp: 12000 })
		const req = reporter.decorate({ url: SEGMENT, headers: { Accept: '*/*' } }, { br: { v: 3000 }, d: 4000, dl: 1000, nor: 'https://cdn.example.com/next-seg.mp4', ot: 'v', tb: { v: 6000 } })
		deepEqual(req.headers, { Accept: '*/*', ...EX_8_1_1_HEADERS })
		equal(req.url, SEGMENT)
	})

	it('reproduces 8.1.2 and 8.1.3', () => {
		const audio = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'br', 'cid', 'd', 'mtp', 'ot', 'sid', 'st'] })
		const reporter = audio.createReporter({ cid: 'content-id-123' })
		reporter.update({ st: 'v', bl: 2000, mtp: 15000 })
		equal(queryValue(reporter.decorate({ url: SEGMENT }, { br: 320, d: 2000, ot: 'a' }).url), EX_8_1_2)

		const minimal = createCmcdSession({ sid: 'session-id-123', keys: ['cid', 'sid'] })
		equal(queryValue(minimal.createReporter({ cid: 'content-id-123' }).decorate({ url: SEGMENT }).url), EX_8_1_3)
	})

	it('reproduces 8.1.5 with buffered error codes', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['cid', 'ec', 'sid', 'sta'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sta: 'p' })
		reporter.recordError('CODEC_NOT_SUPPORTED')
		equal(queryValue(reporter.decorate({ url: SEGMENT }).url), EX_8_1_5[0])
		equal(queryValue(reporter.decorate({ url: SEGMENT }).url), 'cid="content-id-123",sid="session-id-123",sta=p,v=2')
		reporter.recordError(['DRM_NOT_SUPPORTED', 'PLAYBACK_FAILED'])
		reporter.update({ sta: 'f' })
		equal(queryValue(reporter.decorate({ url: SEGMENT }).url), EX_8_1_5[1])
	})

	it('reproduces 8.1.6 with supplied bs', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'bs', 'cid', 'ot', 'sid', 'sta'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sta: 'r', bl: 0 })
		equal(queryValue(reporter.decorate({ url: SEGMENT }, { ot: 'v', bs: true }).url), EX_8_1_6[0])
		equal(queryValue(reporter.decorate({ url: SEGMENT }, { ot: 'v', bs: true, bl: { v: 0, a: 2000 } }).url), EX_8_1_6[1])
	})

	it('reproduces 8.1.7 with two reporters in one session', () => {
		const session = createCmcdSession({ sid: 'session-common-1', keys: ['cid', 'nr', 'ot', 'sid'] })
		const primary = session.createReporter({ cid: 'movie-123' })
		const ad = session.createReporter({ cid: 'ad-555' })
		ad.update({ nr: true })
		equal(queryValue(primary.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.primary)
		equal(queryValue(ad.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.ad)
		primary.update({ nr: true })
		ad.update({ nr: undefined })
		equal(queryValue(primary.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.primaryHidden)
		equal(queryValue(ad.decorate({ url: SEGMENT }, { ot: 'v' }).url), EX_8_1_7.adShown)
	})

	it('reproduces 8.1.8 with every request-mode key', () => {
		const session = createCmcdSession({ sid: 'session-id-123' })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ bg: true, bsa: { v: 3 }, bsd: { v: 1200, a: 100 }, bsda: { v: 4150, a: 300 }, cs: 'g48djn236sk2', dfa: 32, ltc: 13500, msd: 1700, pr: 1.1, pt: 632782, rtp: 12000, sf: 'd', st: 'l', sta: 'p', su: true, nr: true })
		reporter.recordError('2001')
		const req = reporter.decorate({ url: SEGMENT }, { bl: { v: 2100, a: 1800 }, br: { v: 3000, a: 164 }, bs: true, d: 4000, dl: 1000, lb: { v: 500, a: 32 }, mtp: { v: 15000, a: 6000 }, nor: 'https://cdn.example.com/next-seg.mp4', ot: 'v', pb: { v: 2000, a: 164 }, tb: { v: 6000, a: 350 }, tbl: { v: 2000, a: 2000 }, tpb: { v: 5000, a: 164 } })
		equal(queryValue(req.url), EX_8_1_8)
	})

	it('numbers request-mode reports from zero and replaces an existing CMCD parameter', () => {
		const session = createCmcdSession({ sid: 's', keys: ['sid', 'sn'] })
		const reporter = session.createReporter()
		const first = reporter.decorate({ url: 'https://cdn.example.com/a?x=1#frag' })
		equal(first.url, 'https://cdn.example.com/a?x=1&CMCD=sid%3D%22s%22%2Csn%3D0%2Cv%3D2#frag')
		const second = reporter.decorate(first)
		equal(second.url, 'https://cdn.example.com/a?x=1&CMCD=sid%3D%22s%22%2Csn%3D1%2Cv%3D2#frag')
	})

	it('encodes version 1 request mode', () => {
		const session = createCmcdSession({ sid: 's', version: 1 })
		const reporter = session.createReporter({ cid: 'c' })
		reporter.update({ sf: 'd', st: 'v', bl: { v: 2000, a: 1000 }, mtp: 15000 })
		const req = reporter.decorate({ url: SEGMENT }, { br: { v: 3000 }, d: 4000, ot: 'v', nor: { url: 'https://cdn.example.com/next seg.mp4', range: '0-99' } })
		equal(queryValue(req.url), 'bl=2000,br=3000,cid="c",d=4000,dl=2000,mtp=15000,nor="next%20seg.mp4",nrr="0-99",ot=v,sf=d,sid="s",st=v')
	})
})
