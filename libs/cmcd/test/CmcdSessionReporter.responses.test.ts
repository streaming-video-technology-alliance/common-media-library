import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_2_3 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'
const CMSD_STATIC = atob('c2lkPSI5YTNiLTIxY2QiO2JyPTQ1MDA7ZD00MDAwO290PXY7c3Q9dg==')
const CMSD_DYNAMIC = atob('ZXRwPTEyNTAwO3J0dD0zNTttYj02MDAwO3JkPTIwMA==')

function harness(sid: string, cid: string, keys: string[], batchSize?: number) {
	const mock = createMockRequester()
	const session = createCmcdSession({ sid, requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['rr'], keys: keys as never, interval: 0, batchSize }] })
	return { mock, session, reporter: session.createReporter({ cid }) }
}

describe('CmcdSessionReporter responses', () => {
	it('reproduces 8.2.3 from the decorated request, the headers, and the timing', async () => {
		const { mock, reporter } = harness('session1', 'bbb', ['cid', 'cmsdd', 'cmsds', 'nor', 'ot', 'rc', 'sid', 'ttfb', 'ttlb', 'url'])
		const req = reporter.decorate({ url: `${CDN}/index.mpd` }, { ot: 'v', nor: `${CDN}/video/segment-6.m4v` })
		reporter.recordResponse(req, {
			status: 200,
			headers: { 'CMSD-Static': CMSD_STATIC, 'cmsd-dynamic': CMSD_DYNAMIC },
			timing: { startTime: 1000, responseStart: 1180, responseEnd: 1200 },
		}, { ts: 1763657019723, url: 'video/segment-5.m4v' })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_3])
	})

	it('derives url, rc, ts, and ttlb without timing, and reads a Headers object', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const { mock, reporter } = harness('s', 'c', ['cmsds', 'rc', 'sid', 'ttlb', 'url'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s?a=1` })
		context.mock.timers.setTime(1250)
		reporter.recordResponse(req, { status: 206, headers: new Headers({ 'CMSD-Static': 'ot=v' }) })
		await flushPromises()
		deepEqual(mock.bodies(), [`cmsds="${btoa('ot=v')}",e=rr,rc=206,sid="s",ts=1000,ttlb=250,url="${CDN}/seg.m4s?a=1",v=2`])
	})

	it('omits unavailable timing values', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 5000 })
		const { mock, reporter } = harness('s', 'c', ['rc', 'sid', 'ttfb', 'ttlb', 'url'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		reporter.recordResponse(req, { status: 200, timing: { startTime: 5000, responseStart: 0, responseEnd: 5100 } }, { ts: 7 })
		context.mock.timers.setTime(5040)
		reporter.recordResponse(req, { status: 200, timing: { startTime: 5000, responseStart: 0, responseEnd: 4000, duration: 0 } }, { ts: 8 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			`e=rr,rc=200,sid="s",ts=7,ttlb=100,url="${CDN}/seg.m4s",v=2`,
			`e=rr,rc=200,sid="s",ts=8,ttlb=40,url="${CDN}/seg.m4s",v=2`,
		])
	})

	it('reports a URL-only response under the calling reporter, without the CMCD parameter', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const { mock, reporter } = harness('s', 'c', ['cid', 'rc', 'sid', 'url'])
		reporter.recordResponse({ url: `${CDN}/x?CMCD=abc&y=2` }, { status: 404 })
		await flushPromises()
		deepEqual(mock.bodies(), [`cid="c",e=rr,rc=404,sid="s",ts=1000,url="${CDN}/x?y=2",v=2`])
	})

	it('attributes a spread copy, uses the cid at decoration, and falls back after a JSON round trip', async () => {
		const { mock, reporter } = harness('s', 'first', ['cid', 'rc', 'sid'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		reporter.update({ cid: 'second' })
		reporter.recordResponse({ ...req }, { status: 200 }, { ts: 1 })
		reporter.recordResponse(JSON.parse(JSON.stringify(req)), { status: 200 }, { ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			`cid="first",e=rr,rc=200,sid="s",ts=1,url="${CDN}/seg.m4s",v=2`,
			`cid="second",e=rr,rc=200,sid="s",ts=2,url="${CDN}/seg.m4s",v=2`,
		])
	})

	it('accepts the response overrides and reports after the reporter is disposed', async () => {
		const { mock, reporter } = harness('s', 'c', ['rc', 'sid', 'smrt', 'ttfb', 'ttfbb', 'ttlb'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		reporter.dispose()
		reporter.recordResponse(req, { status: 200 }, { ts: 3, ttfb: 5, ttfbb: 12, ttlb: 40, smrt: 'abc' })
		await flushPromises()
		deepEqual(mock.bodies(), [`e=rr,rc=200,sid="s",smrt="abc",ts=3,ttfb=5,ttfbb=12,ttlb=40,url="${CDN}/seg.m4s",v=2`])
	})

	it('does not change a late report when the player mutates its per-request data object', async () => {
		const { mock, reporter } = harness('s', 'c', ['br', 'ot', 'rc', 'sid'])
		const data = { ot: 'v' as const, br: { v: 3000 } }
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` }, data)
		data.br.v = 1
		reporter.recordResponse(req, { status: 200 }, { ts: 1 })
		await flushPromises()
		deepEqual(mock.bodies(), [`br=(3000;v),e=rr,ot=v,rc=200,sid="s",ts=1,url="${CDN}/seg.m4s",v=2`])
	})

	it('lets per-request data win over the cid at decoration', async () => {
		const { mock, reporter } = harness('s', 'store-cid', ['cid', 'rc', 'sid', 'url'])
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` }, { cid: 'per-request-cid' })
		reporter.recordResponse(req, { status: 200 }, { ts: 1 })
		await flushPromises()
		deepEqual(mock.bodies(), [`cid="per-request-cid",e=rr,rc=200,sid="s",ts=1,url="${CDN}/seg.m4s",v=2`])
	})

	it('drains at once after the session is disposed, even when the target batches more than one line', async () => {
		const { mock, session, reporter } = harness('s', 'c', ['rc', 'sid'], 5)
		const req = reporter.decorate({ url: `${CDN}/seg.m4s` })
		session.dispose()
		reporter.recordResponse(req, { status: 200 }, { ts: 1 })
		await flushPromises()
		deepEqual(mock.bodies(), [`e=rr,rc=200,sid="s",ts=1,url="${CDN}/seg.m4s",v=2`])
	})
})
