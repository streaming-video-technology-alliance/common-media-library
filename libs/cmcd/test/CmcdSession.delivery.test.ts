import type { CmcdRequester } from '@svta/cml-cmcd'
import { CMCD_MIME_TYPE, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal } from 'node:assert'
import type { TestContext } from 'node:test'
import { describe, it, mock } from 'node:test'
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

describe('CmcdSession delivery state machine', () => {
	async function twoLines(status: number, context: TestContext) {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester(status)
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		return { requester, session, reporter }
	}

	it('silences a target for the rest of the sid after a 410', async (context) => {
		const { requester, session } = await twoLines(410, context)
		equal(requester.requests.length, 1)
		requester.status = 200
		session.flush()
		await flushPromises()
		equal(requester.requests.length, 1)
		session.dispose()
	})

	it('backs off after a 429 and aggregates the lines queued during the wait', async (context) => {
		const { requester, session } = await twoLines(429, context)
		deepEqual(requester.bodies(), ['e=ps,sid="s",sta=p,ts=1,v=2'])
		context.mock.timers.tick(999)
		await flushPromises()
		equal(requester.requests.length, 1)
		context.mock.timers.tick(1)
		await flushPromises()
		equal(requester.bodies()[1], 'e=ps,sid="s",sta=p,ts=1,v=2\ne=ps,sid="s",sta=a,ts=2,v=2')
		requester.status = 200
		context.mock.timers.tick(1999)
		await flushPromises()
		equal(requester.requests.length, 2)
		context.mock.timers.tick(1)
		await flushPromises()
		equal(requester.requests.length, 3)
		equal(requester.bodies()[2], requester.bodies()[1])
		session.dispose()
	})

	it('retries a 5xx and a rejection, and drops the batch on another 4xx', async (context) => {
		const { requester, session } = await twoLines(503, context)
		equal(requester.requests.length, 1)
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(requester.requests.length, 2)
		session.dispose()

		let attempts = 0
		const rejecting = createCmcdSession({ sid: 'r', requester: () => {
			attempts += 1
			return Promise.reject(new Error('offline'))
		}, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		rejecting.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		equal(attempts, 1)
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(attempts, 2)
		rejecting.dispose()

		const dropping = createMockRequester(400)
		const other = createCmcdSession({ sid: 'd', requester: dropping.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		const reporter = other.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		dropping.status = 200
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		deepEqual(dropping.bodies(), ['e=ps,sid="d",sta=p,ts=1,v=2', 'e=ps,sid="d",sta=a,ts=2,v=2'])
		other.dispose()
	})

	it('forgets the drain request when another 4xx drops the batch', async () => {
		const dropping = createMockRequester(404)
		const session = createCmcdSession({ sid: 'd', requester: dropping.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 2 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		session.flush()
		await flushPromises()
		equal(dropping.requests.length, 1)
		dropping.status = 200
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		equal(dropping.requests.length, 1)
		reporter.update({ sta: 'p', ts: 3 })
		await flushPromises()
		equal(dropping.bodies()[1], 'e=ps,sid="d",sta=a,ts=2,v=2\ne=ps,sid="d",sta=p,ts=3,v=2')
		session.dispose()
	})

	it('keeps the newest maxQueueSize lines when a failed batch is unshifted back', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester(503)
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 2, maxQueueSize: 2 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'a', ts: 2 })
		reporter.update({ sta: 'p', ts: 3 })
		await flushPromises()
		requester.status = 200
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(requester.bodies(), [
			'e=ps,sid="s",sta=p,ts=1,v=2\ne=ps,sid="s",sta=a,ts=2,v=2',
			'e=ps,sid="s",sta=a,ts=2,v=2\ne=ps,sid="s",sta=p,ts=3,v=2',
		])
		session.dispose()
	})

	it('keeps the newest maxQueueSize lines when a push exceeds the cap during a send', async () => {
		let release: ((value: { status: number }) => void) | undefined
		const bodies: string[] = []
		const requester = (request: HttpRequest) => {
			bodies.push(request.body as string)
			return new Promise<{ status: number }>((resolve) => {
				release = resolve
			})
		}
		const session = createCmcdSession({ sid: 's', requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 2, maxQueueSize: 2 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'a', ts: 2 })
		equal(bodies.length, 1)
		reporter.update({ sta: 'p', ts: 3 })
		reporter.update({ sta: 'a', ts: 4 })
		reporter.update({ sta: 'p', ts: 5 })
		release?.({ status: 200 })
		await flushPromises()
		release?.({ status: 200 })
		await flushPromises()
		deepEqual(bodies, [
			'e=ps,sid="s",sta=p,ts=1,v=2\ne=ps,sid="s",sta=a,ts=2,v=2',
			'e=ps,sid="s",sta=a,ts=4,v=2\ne=ps,sid="s",sta=p,ts=5,v=2',
		])
		session.dispose()
	})

	it('honors a drain requested while a send is in flight', async () => {
		let release: ((value: { status: number }) => void) | undefined
		const bodies: string[] = []
		const requester = (request: HttpRequest) => {
			bodies.push(request.body as string)
			return new Promise<{ status: number }>((resolve) => {
				release = resolve
			})
		}
		const session = createCmcdSession({ sid: 's', requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 10 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		session.flush()
		reporter.update({ sta: 'a', ts: 2 })
		reporter.update({ sta: 'p', ts: 3 })
		session.dispose()
		equal(bodies.length, 1)
		release?.({ status: 200 })
		await flushPromises()
		deepEqual(bodies, ['e=ps,sid="s",sta=p,ts=1,v=2', 'e=ps,sid="s",sta=a,ts=2,v=2\ne=ps,sid="s",sta=p,ts=3,v=2'])
	})

	it('flush() fires an armed retry at once', async (context) => {
		const { requester, session } = await twoLines(429, context)
		requester.status = 200
		session.flush()
		await flushPromises()
		equal(requester.requests.length, 2)
		context.mock.timers.tick(60000)
		await flushPromises()
		equal(requester.requests.length, 2)
		session.dispose()
	})

	it('stops retrying an ended sid state after the 60 second step and reports it', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const onError = mock.fn()
		const requester = createMockRequester(503)
		const session = createCmcdSession({ sid: 'a', requester: requester.requester, onError, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		session.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		session.rotate('b')
		await flushPromises()
		let sent = 2
		equal(requester.requests.length, sent)
		for (const wait of [2000, 4000, 8000, 16000, 32000, 60000]) {
			context.mock.timers.tick(wait - 1)
			await flushPromises()
			equal(requester.requests.length, sent)
			context.mock.timers.tick(1)
			await flushPromises()
			sent += 1
			equal(requester.requests.length, sent)
		}
		equal(requester.requests.length, 8)
		equal(onError.mock.callCount(), 1)
		const error = onError.mock.calls[0].arguments[0] as Error
		equal(error.message, `CmcdSession: send failed for target ${COLLECTOR} after the back-off cap, status 503`)
		context.mock.timers.tick(120000)
		await flushPromises()
		equal(requester.requests.length, 8)
		session.dispose()
	})

	it('gives the requester error as the cause of the give-up error', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const onError = mock.fn()
		const offline = new Error('offline')
		const session = createCmcdSession({ sid: 'a', requester: () => Promise.reject(offline), onError, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		session.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		session.rotate('b')
		await flushPromises()
		for (const wait of [2000, 4000, 8000, 16000, 32000, 60000]) {
			context.mock.timers.tick(wait)
			await flushPromises()
		}
		equal(onError.mock.callCount(), 1)
		const error = onError.mock.calls[0].arguments[0] as Error
		equal(error.message, `CmcdSession: send failed for target ${COLLECTOR} after the back-off cap, status 0`)
		equal(error.cause, offline)
		session.dispose()
	})

	it('retries a status 0 response', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester(0)
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		session.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		equal(requester.requests.length, 1)
		requester.status = 200
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(requester.bodies(), ['e=ps,sid="s",sta=p,ts=1,v=2', 'e=ps,sid="s",sta=p,ts=1,v=2'])
		session.dispose()
	})

	it('accepts a thenable and a plain object from the requester', async () => {
		const thenables: string[] = []
		const thenable = (request: HttpRequest) => {
			thenables.push(request.body as string)
			return { then: (onFulfilled: (value: { status: number }) => void) => onFulfilled({ status: 200 }) }
		}
		const first = createCmcdSession({ sid: 's', requester: thenable as unknown as CmcdRequester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		first.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		deepEqual(thenables, ['e=ps,sid="s",sta=p,ts=1,v=2'])
		first.dispose()

		const plain: string[] = []
		const direct = (request: HttpRequest) => {
			plain.push(request.body as string)
			return { status: 200 }
		}
		const second = createCmcdSession({ sid: 'p', requester: direct as unknown as CmcdRequester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		second.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		deepEqual(plain, ['e=ps,sid="p",sta=p,ts=1,v=2'])
		second.dispose()
	})

	it('posts through fetch with keepalive by default', async (context) => {
		const calls: { url: string; init: RequestInit }[] = []
		context.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
			calls.push({ url, init })
			return new Response(null, { status: 204 })
		})
		const session = createCmcdSession({ sid: 's', eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
		session.createReporter().update({ sta: 'p', ts: 1 })
		await flushPromises()
		equal(calls.length, 1)
		equal(calls[0].url, COLLECTOR)
		equal(calls[0].init.method, 'POST')
		equal(calls[0].init.body, 'e=ps,sid="s",sta=p,ts=1,v=2')
		equal(calls[0].init.keepalive, true)
		session.dispose()
	})
})
