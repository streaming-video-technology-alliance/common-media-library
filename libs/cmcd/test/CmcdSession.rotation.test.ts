import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession rotation', () => {
	it('restarts sn per target, re-arms the msd gate, resets the baselines, and emits nothing', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, keys: ['msd', 'sid', 'sn'], eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['msd', 'sid', 'sn', 'sta'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 's', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1200 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'msd=200,sid="a",sn=0,v=2')
		session.rotate('b')
		equal(session.sid, 'b')
		await flushPromises()
		equal(mock.requests.length, 2)
		equal(queryValue(reporter.decorate({ url: `${CDN}/b` }).url), 'sid="b",sn=0,v=2')
		reporter.update({ sta: 'p', ts: 1300 })
		await flushPromises()
		equal(mock.bodies()[2], 'e=ps,sid="b",sn=0,sta=p,ts=1300,v=2')
		session.rotate('b')
		equal(mock.requests.length, 3)
		throws(() => session.rotate('x'.repeat(65)), { message: /^CmcdSession: sid must be/ })
		session.dispose()
	})

	it('carries a startup measurement in progress', () => {
		const session = createCmcdSession({ sid: 'a', keys: ['msd', 'sid'] })
		const reporter = session.createReporter()
		reporter.update({ sta: 's', ts: 1000 })
		session.rotate('manifest-sid')
		reporter.update({ sta: 's', ts: 1100 })
		reporter.update({ sta: 'p', ts: 1500 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'msd=500,sid="manifest-sid",v=2')
	})

	it('drains the old queue at once and re-activates a target that a 410 silenced', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0, batchSize: 5 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		equal(mock.requests.length, 0)
		session.rotate('b')
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,sid="a",sta=p,ts=1,v=2\ne=ps,sid="a",sta=a,ts=2,v=2'])
		mock.status = 410
		session.flush()
		reporter.update({ sta: 'p', ts: 3 })
		session.flush()
		await flushPromises()
		equal(mock.requests.length, 2)
		mock.status = 200
		reporter.update({ sta: 'a', ts: 4 })
		session.flush()
		await flushPromises()
		equal(mock.requests.length, 2)
		session.rotate('c')
		reporter.update({ sta: 'p', ts: 5 })
		session.flush()
		await flushPromises()
		equal(mock.bodies()[2], 'e=ps,sid="c",sta=p,ts=5,v=2')
		session.dispose()
	})

	it('sends the old queue at once while a back-off is armed', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const mock = createMockRequester(503)
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid', 'sta'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		await flushPromises()
		equal(mock.requests.length, 1)
		mock.status = 200
		reporter.update({ sta: 'a', ts: 2 })
		await flushPromises()
		equal(mock.requests.length, 1)
		session.rotate('b')
		await flushPromises()
		equal(mock.requests.length, 2)
		equal(mock.bodies()[1], 'e=ps,sid="a",sta=p,ts=1,v=2\ne=ps,sid="a",sta=a,ts=2,v=2')
		context.mock.timers.tick(60000)
		await flushPromises()
		equal(mock.requests.length, 2)
		session.dispose()
	})

	it('reports a late response under the old sid with the store copied at rotation', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'a', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['rr'], keys: ['bl', 'rc', 'sid', 'sn'], interval: 0, batchSize: 5 }] })
		const reporter = session.createReporter()
		reporter.update({ bl: 1000 })
		const req = reporter.decorate({ url: `${CDN}/a` })
		session.rotate('b')
		reporter.update({ bl: 9000 })
		reporter.recordResponse(req, { status: 200 }, { ts: 7 })
		await flushPromises()
		deepEqual(mock.bodies(), [`bl=(1000),e=rr,rc=200,sid="a",sn=0,ts=7,url="${CDN}/a",v=2`])
		reporter.recordResponse(reporter.decorate({ url: `${CDN}/b` }), { status: 200 }, { ts: 8 })
		session.flush()
		await flushPromises()
		equal(mock.bodies()[1], `bl=(9000),e=rr,rc=200,sid="b",sn=0,ts=8,url="${CDN}/b",v=2`)
		session.dispose()
	})

	it('measures a stall open at rotation from the rotation time, counts it, and keeps bs set', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 5000 })
		const session = createCmcdSession({ sid: 'a', keys: ['bs', 'bsa', 'bsd', 'bsda', 'sid'] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1000 })
		reporter.update({ sta: 'r', ts: 4000 })
		session.rotate('b')
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'bs,bsa=(1),sid="b",v=2')
		reporter.update({ sta: 'p', ts: 5300 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'bs,bsa=(1),bsd=(300),bsda=(300),sid="b",v=2')
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'bsa=(1),bsda=(300),sid="b",v=2')
	})

	it('lets an ended sid state be collected once its requests are released', async () => {
		const v8 = await import('node:v8')
		const vm = await import('node:vm')
		v8.setFlagsFromString('--expose-gc')
		const gc = vm.runInNewContext('gc') as () => void
		const session = createCmcdSession({ sid: 'a' })
		const reporter = session.createReporter()
		let req: { cmcd: object } | undefined = reporter.decorate({ url: `${CDN}/a` })
		const ref = new WeakRef(req.cmcd)
		session.rotate('b')
		req = undefined
		for (let i = 0; i < 10 && ref.deref() !== undefined; i++) {
			await new Promise(resolve => setTimeout(resolve, 0))
			gc()
		}
		equal(ref.deref(), undefined)
		session.dispose()
	})
})
