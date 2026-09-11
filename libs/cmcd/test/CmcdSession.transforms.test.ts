import type { Cmcd, CmcdSession } from '@svta/cml-cmcd'
import { createCmcdSession } from '@svta/cml-cmcd'
import { SfItem } from '@svta/cml-structured-field-values'
import { deepEqual, equal, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession transforms', () => {
	it('runs the request transform on the normalized report with the request, and cancels with null', () => {
		const seen: Cmcd[] = []
		const session = createCmcdSession({
			sid: 's',
			keys: ['br', 'sid', 'com.example-x'],
			transform: (data, request) => {
				seen.push(data)
				return request.url.endsWith('skip') ? null : { ...data, 'com.example-x': 'y' }
			},
		})
		const reporter = session.createReporter()
		const req = reporter.decorate({ url: `${CDN}/a` }, { br: { v: 3000 } })
		equal(queryValue(req.url), 'br=(3000;v),com.example-x="y",sid="s",v=2')
		equal(Array.isArray(seen[0].br), true)
		const skipped = reporter.decorate({ url: `${CDN}/skip` })
		equal(skipped.url, `${CDN}/skip`)
		deepEqual(skipped.cmcd, { sid: 's', data: {} })
		equal(queryValue(reporter.decorate({ url: `${CDN}/b` }).url), 'com.example-x="y",sid="s",v=2')
	})

	it('cancels one event target only, restores required keys, and re-stamps sid, e, and ts', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps'], keys: ['sid', 'sta'], interval: 0, transform: () => null },
			{ url: `${COLLECTOR}/2`, events: ['ps'], keys: ['sid', 'sta'], interval: 0, transform: (data) => {
				const copy = { ...data, sid: 'forged', e: 't', ts: 1 } as Cmcd
				delete copy.sta
				return copy
			} },
			{ url: `${COLLECTOR}/3`, events: ['ps'], keys: ['sid', 'sta'], interval: 0 },
		] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 5 })
		await flushPromises()
		deepEqual(mock.requests.map(request => request.url), [`${COLLECTOR}/2`, `${COLLECTOR}/3`])
		deepEqual(mock.bodies(), ['e=ps,sid="s",sta=p,ts=5,v=2', 'e=ps,sid="s",sta=p,ts=5,v=2'])
	})

	it('gives an rr transform the decorated request and other events undefined', async () => {
		const mock = createMockRequester()
		const urls: (string | undefined)[] = []
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['rr', 'ps'], keys: ['sid'], interval: 0, transform: (data, request) => {
			urls.push(request?.url)
			return data
		} }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p' })
		const req = reporter.decorate({ url: `${CDN}/a` })
		reporter.recordResponse(req, { status: 200 })
		await flushPromises()
		deepEqual(urls, [undefined, req.url])
	})

	it('opts in to bg=?0 on the exit b report through a transform', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['b'], keys: ['bg', 'sid'], interval: 0, transform: (data) => data.e === 'b' && !('bg' in data) ? { ...data, bg: false } : data }] })
		const reporter = session.createReporter()
		reporter.update({ bg: true, ts: 1 })
		reporter.update({ bg: false, ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies(), ['bg,e=b,sid="s",ts=1,v=2', 'bg=?0,e=b,sid="s",ts=2,v=2'])
	})

	it('keeps the request and the remaining targets on the old sid when a transform rotates', async () => {
		const mock = createMockRequester()
		const session: CmcdSession = createCmcdSession({ sid: 'a', requester: mock.requester, keys: ['sid'], transform: (data) => {
			session.rotate('b')
			return data
		}, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps', 'rr'], keys: ['sid'], interval: 0, transform: (data) => {
				session.rotate('c')
				return data
			} },
			{ url: `${COLLECTOR}/2`, events: ['ps', 'rr'], keys: ['sid'], interval: 0 },
		] })
		const reporter = session.createReporter()
		const req = reporter.decorate({ url: `${CDN}/a` })
		equal(req.cmcd.sid, 'a')
		equal(queryValue(req.url), 'sid="a",v=2')
		equal(session.sid, 'b')
		reporter.update({ sta: 'p', ts: 1 })
		reporter.recordResponse(req, { status: 200 }, { ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,sid="b",sta=p,ts=1,v=2', 'e=ps,sid="b",sta=p,ts=1,v=2', `e=rr,sid="a",ts=2,url="${CDN}/a",v=2`, `e=rr,sid="a",ts=2,url="${CDN}/a",v=2`])
		equal(session.sid, 'c')
		session.dispose()
	})

	it('rethrows a throwing transform after the other targets ran', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps'], keys: ['sid'], interval: 0, transform: () => {
				throw new Error('boom')
			} },
			{ url: `${COLLECTOR}/2`, events: ['ps'], keys: ['sid'], interval: 0 },
		] })
		const reporter = session.createReporter()
		throws(() => reporter.update({ sta: 'p', ts: 1 }), { message: /boom/ })
		await flushPromises()
		deepEqual(mock.requests.map(request => request.url), [`${COLLECTOR}/2`])
	})

	it('copies a nested custom value so a transform cannot corrupt the store or another target', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/1`, events: ['ps'], keys: ['sid', 'com.example-i'], interval: 0, transform: (data) => {
				const item = data['com.example-i'] as SfItem<string> | undefined
				if (item) {
					item.value = 'HACKED'
				}
				return data
			} },
			{ url: `${COLLECTOR}/2`, events: ['ps'], keys: ['sid', 'com.example-i'], interval: 0 },
		] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1, 'com.example-i': new SfItem('safe', { q: 1 }) })
		await flushPromises()
		deepEqual(mock.bodies(), [
			'com.example-i="HACKED";q=1,e=ps,sid="s",sta=p,ts=1,v=2',
			'com.example-i="safe";q=1,e=ps,sid="s",sta=p,ts=1,v=2',
		])
		reporter.update({ sta: 'r', ts: 2 })
		await flushPromises()
		deepEqual(mock.bodies().slice(2), [
			'com.example-i="HACKED";q=1,e=ps,sid="s",sta=r,ts=2,v=2',
			'com.example-i="safe";q=1,e=ps,sid="s",sta=r,ts=2,v=2',
		])
	})

	it('keeps a ranged nor entry through renormalization in v2 request mode', () => {
		const session = createCmcdSession({ sid: 's', keys: ['nor', 'sid'], transform: (data) => data })
		const reporter = session.createReporter()
		const req = reporter.decorate({ url: `${CDN}/seg1.m4s` }, { nor: { url: `${CDN}/seg2.m4s`, range: '0-99' } })
		equal(queryValue(req.url), 'nor=("seg2.m4s";r="0-99"),sid="s",v=2')
	})

	it('keeps a two-entry nor list through renormalization for an event target', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: COLLECTOR, events: ['ps'], keys: ['nor', 'sid'], interval: 0, transform: (data) => data },
		] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1, nor: ['seg1.m4s', { url: 'seg2.m4s', range: '0-99' }] })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,nor=("seg1.m4s" "seg2.m4s";r="0-99"),sid="s",sta=p,ts=1,v=2'])
	})

	it('assigns sn after the transform so a transform cannot set or remove it', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sn'], interval: 0, transform: (data) => {
				equal('sn' in data, false)
				return { ...data, sn: 999 }
			} },
		] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,sid="s",sn=0,sta=p,ts=1,v=2'])
	})

	it('restores sta after a transform deletes it in place', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, transform: (data) => {
				delete data.sta
				return data
			} },
		] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,sid="s",sta=p,ts=1,v=2'])
	})
})
