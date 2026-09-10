import { CMCD_MIME_TYPE, createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_2_1 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const TIMERS = { apis: ['Date', 'setTimeout', 'setInterval'] as ('Date' | 'setTimeout' | 'setInterval')[], now: 1764752370000 }

describe('CmcdSession delivery', () => {
	it('reproduces 8.2.1: a minimal t report after one interval', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: [] }] })
		session.createReporter({ cid: 'content-id-123' })
		context.mock.timers.tick(29999)
		await flushPromises()
		equal(mock.requests.length, 0)
		context.mock.timers.tick(1)
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_1])
		equal(mock.requests[0].method, 'POST')
		equal(mock.requests[0].url, COLLECTOR)
		deepEqual(mock.requests[0].headers, { 'Content-Type': CMCD_MIME_TYPE })
		session.dispose()
	})

	it('emits one t line per live reporter, in creation order, with the same ts and consecutive sn', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['cid', 'sid', 'sn'], batchSize: 2 }] })
		session.createReporter({ cid: 'movie' })
		session.createReporter({ cid: 'ad' })
		context.mock.timers.tick(30000)
		await flushPromises()
		deepEqual(mock.bodies(), ['cid="movie",e=t,sid="s",sn=0,ts=1764752400000,v=2\ncid="ad",e=t,sid="s",sn=1,ts=1764752400000,v=2'])
		session.dispose()
	})

	it('emits a session-only line when the session has no reporter', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'] }] })
		context.mock.timers.tick(30000)
		await flushPromises()
		deepEqual(mock.bodies(), ['e=t,sid="s",ts=1764752400000,v=2'])
		session.dispose()
	})

	it('honors interval, batchSize, headers, and flush()', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'], interval: 10, batchSize: 3, headers: { Authorization: 'Bearer x' } }] })
		session.createReporter()
		context.mock.timers.tick(10000)
		context.mock.timers.tick(10000)
		await flushPromises()
		equal(mock.requests.length, 0)
		session.flush()
		await flushPromises()
		deepEqual(mock.bodies(), ['e=t,sid="s",ts=1764752380000,v=2\ne=t,sid="s",ts=1764752390000,v=2'])
		deepEqual(mock.requests[0].headers, { 'Content-Type': CMCD_MIME_TYPE, Authorization: 'Bearer x' })
		context.mock.timers.tick(30000)
		await flushPromises()
		equal(mock.requests.length, 2)
		session.dispose()
	})

	it('drains on dispose() and stops the timers', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'], batchSize: 5 }] })
		session.createReporter()
		context.mock.timers.tick(30000)
		session.dispose()
		await flushPromises()
		equal(mock.requests.length, 1)
		context.mock.timers.tick(60000)
		await flushPromises()
		equal(mock.requests.length, 1)
	})

	it('disables t with interval 0', async (context) => {
		context.mock.timers.enable(TIMERS)
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, interval: 0 }] })
		session.createReporter()
		context.mock.timers.tick(120000)
		await flushPromises()
		equal(mock.requests.length, 0)
		session.dispose()
	})
})
