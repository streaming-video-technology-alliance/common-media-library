import type { CmcdSession, CmcdSessionReporter } from '@svta/cml-cmcd'
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it, type TestContext } from 'node:test'
import { EX_8_1_4, EX_8_2_2, EX_8_2_5 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'
const KEYS_8_2_2 = ['bl', 'br', 'bs', 'bsd', 'cid', 'ec', 'h', 'lb', 'msd', 'mtp', 'pb', 'pr', 'pt', 'sf', 'sid', 'sn', 'st', 'sta', 'su', 'tb', 'tpb'] as const

/** The example numbers its reports from 1. The reporter numbers from 0, per the reset-to-zero rule. */
function fromZero(line: string): string {
	return line.replace(/sn=(\d+)/, (_, n: string) => `sn=${Number(n) - 1}`)
}

/** Drives the player state of example 8.2.2 through five interval ticks. */
async function runExample822(context: TestContext, session: CmcdSession, reporter: CmcdSessionReporter): Promise<void> {
	reporter.update({ h: 'example.com' })
	reporter.update({ sta: 's', bl: 0, pt: 0, ts: 1764752399000 })
	context.mock.timers.tick(30000)
	reporter.update({ sta: 'p', ts: 1764752399812 })
	reporter.update({ bl: 6000, br: { v: 4200, a: 256 }, lb: { v: 523, a: 64 }, mtp: { v: 87000, a: 49000 }, pb: { v: 4200, a: 256 }, pt: 29188, sf: 'd', st: 'v', tb: { v: 4200, a: 256 }, tpb: { v: 4200, a: 256 } })
	context.mock.timers.tick(30000)
	reporter.update({ sta: 'r', ts: 1764752458000 })
	reporter.update({ bsd: { v: 720 } })
	reporter.update({ sta: 'p', ts: 1764752458720 })
	reporter.recordError('MEDIA_ERR_NETWORK')
	reporter.update({ bl: 3200, mtp: { v: 89000, a: 52000 }, pt: 59188 })
	context.mock.timers.tick(30000)
	reporter.update({ bl: 6000, mtp: { v: 81000, a: 55000 }, pt: 89188 })
	context.mock.timers.tick(30000)
	reporter.update({ sta: 'e', pr: 0, bl: 0, mtp: { v: 82000, a: 55000 }, pt: 111000 })
	context.mock.timers.tick(30000)
	await flushPromises()
	session.dispose()
}

describe('CmcdSessionReporter derived keys', () => {
	it('reproduces 8.1.4: su until playing, msd once', () => {
		const session = createCmcdSession({ sid: 'session-id-123', keys: ['bl', 'br', 'cid', 'd', 'msd', 'mtp', 'nor', 'ot', 'sf', 'sid', 'st', 'sta', 'su'] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ st: 'v' })
		equal(queryValue(reporter.decorate({ url: `${CDN}/manifest.mpd` }, { ot: 'm', sf: 'd', su: true }).url), EX_8_1_4[0])
		reporter.update({ sta: 's', bl: 0, mtp: 15000, ts: 1000 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/init.m4v` }, { br: { v: 3000 }, nor: [`${CDN}/seg-1.m4v`, `${CDN}/seg-2.m4v`], ot: 'i' }).url), EX_8_1_4[1])
		equal(queryValue(reporter.decorate({ url: `${CDN}/seg-1.m4v` }, { br: { v: 3000 }, d: 4000, nor: [`${CDN}/seg-2.m4v`, `${CDN}/seg-3.m4v`], ot: 'v' }).url), EX_8_1_4[2])
		reporter.update({ sta: 'p', bl: 4000, ts: 1200 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/seg-2.m4v` }, { br: { v: 3000 }, d: 4000, nor: [`${CDN}/seg-3.m4v`, `${CDN}/seg-4.m4v`], ot: 'v' }).url), EX_8_1_4[3])
		equal(queryValue(reporter.decorate({ url: `${CDN}/seg-3.m4v` }, { ot: 'v' }).url).includes('msd'), false)
	})

	it('reproduces 8.2.2: five interval reports', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1764752370000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: [...KEYS_8_2_2] }] })
		await runExample822(context, session, session.createReporter({ cid: 'content-id-123' }))
		deepEqual(mock.bodies(), EX_8_2_2.map(fromZero))
	})

	it('reproduces 8.3: the first three reports of 8.2.2 in one batch', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1764752370000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: [...KEYS_8_2_2], batchSize: 3 }] })
		await runExample822(context, session, session.createReporter({ cid: 'content-id-123' }))
		equal(mock.bodies()[0], EX_8_2_2.slice(0, 3).map(fromZero).join('\n'))
	})

	it('reproduces 8.2.5: bs while rebuffering and bsd on recovery', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['bs', 'bsd', 'cid', 'sid', 'sta'], interval: 0 }] })
		const reporter = session.createReporter({ cid: 'content-id-123' })
		reporter.update({ sta: 'r', ts: 1764269150889 })
		reporter.update({ sta: 'p', ts: 1764269152389 })
		await flushPromises()
		deepEqual(mock.bodies(), EX_8_2_5)
	})

	it('keeps bs set during a stall and once after recovery, per destination', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bs', 'sid', 'sta'], interval: 1 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p' })
		reporter.update({ sta: 'r' })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		reporter.update({ sta: 'p' })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bs,e=t,sid="s",sta=r,ts=2000,v=2',
			'bs,e=t,sid="s",sta=r,ts=3000,v=2',
			'bs,e=t,sid="s",sta=p,ts=4000,v=2',
			'e=t,sid="s",sta=p,ts=5000,v=2',
		])
		session.dispose()
	})

	it('reports one stall per bsd entry, one per cause per report, in order', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bsa', 'bsd', 'bsda', 'sid'], interval: 1 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1000 })
		reporter.update({ sta: 'r', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1300 })
		reporter.update({ sta: 'r', ts: 1400 })
		reporter.update({ sta: 'p', ts: 2100 })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bsa=(2),bsd=(300),bsda=(1000),e=t,sid="s",ts=2000,v=2',
			'bsa=(2),bsd=(700),bsda=(1000),e=t,sid="s",ts=3000,v=2',
			'bsa=(2),bsda=(1000),e=t,sid="s",ts=4000,v=2',
		])
		session.dispose()
	})

	it('treats a supplied bsd as pending samples per cause and stops automatic detection', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bsd', 'sid'], interval: 1 }] })
		const reporter = session.createReporter()
		reporter.update({ bsd: { v: 100, a: 50 } })
		reporter.update({ bsd: { v: 200 } })
		reporter.update({ sta: 'r', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1900 })
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bsd=(100;v 50;a),e=t,sid="s",ts=2000,v=2',
			'bsd=(200;v),e=t,sid="s",ts=3000,v=2',
			'e=t,sid="s",ts=4000,v=2',
		])
		session.dispose()
	})

	it('caps the pending samples at 100 per cause', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['bsd', 'sid'], interval: 1 }] })
		const reporter = session.createReporter()
		let ts = 1000
		for (let i = 1; i <= 101; i++) {
			reporter.update({ sta: 'r', ts })
			ts += i * 10
			reporter.update({ sta: 'p', ts })
		}
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(mock.bodies()[0], 'bsd=(20),e=t,sid="s",ts=2000,v=2')
		session.dispose()
	})

	it('keeps no samples when no destination can report bsd', () => {
		const session = createCmcdSession({ sid: 's', version: 1 })
		const reporter = session.createReporter()
		reporter.update({ sta: 'r', ts: 1000 })
		reporter.update({ sta: 'p', ts: 1500 })
		session.configure({ version: 2, keys: ['bsd', 'sid'] })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'sid="s",v=2')
	})

	it('derives dl from bl and pr, and the derive switches turn su and dl off', () => {
		const session = createCmcdSession({ sid: 's', keys: ['dl', 'sid', 'su'] })
		const reporter = session.createReporter()
		reporter.update({ sta: 's', bl: 3250, pr: 1 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'dl=3300,sid="s",su,v=2')
		reporter.update({ sta: 'p', bl: 3200, pr: 2 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'dl=1600,sid="s",v=2')
		reporter.update({ dl: 500 })
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'dl=500,sid="s",v=2')

		const off = createCmcdSession({ sid: 's', keys: ['dl', 'sid', 'su'], derive: { dl: false, su: false } })
		const quiet = off.createReporter()
		quiet.update({ sta: 's', bl: 3200 })
		equal(queryValue(quiet.decorate({ url: `${CDN}/a` }).url), 'sid="s",v=2')
	})
})

type FakeDocument = { visibilityState: string; readonly listeners: Set<() => void>; addEventListener(type: string, listener: () => void): void; removeEventListener(type: string, listener: () => void): void }

function installDocument(context: TestContext, visibilityState: string): FakeDocument {
	const fake: FakeDocument = {
		visibilityState,
		listeners: new Set(),
		addEventListener: (_type, listener) => fake.listeners.add(listener),
		removeEventListener: (_type, listener) => fake.listeners.delete(listener),
	}
	const globals = globalThis as { document?: unknown }
	globals.document = fake
	context.after(() => {
		delete globals.document
	})
	return fake
}

describe('CmcdSessionReporter host and background', () => {
	it('emits h when the request host changes, and event reports carry h', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['h', 'ps'], keys: ['h', 'sid'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.decorate({ url: 'https://a.example.com/seg-1.m4s' })
		reporter.decorate({ url: 'https://a.example.com/seg-2.m4s' })
		reporter.decorate({ url: 'https://b.example.com/seg-3.m4s' })
		reporter.update({ sta: 'p', ts: 5 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			'e=h,h="a.example.com",sid="s",ts=1000,v=2',
			'e=h,h="b.example.com",sid="s",ts=1000,v=2',
			'e=ps,h="b.example.com",sid="s",sta=p,ts=5,v=2',
		])
		equal(queryValue(reporter.decorate({ url: 'https://b.example.com/seg-4.m4s' }).url).includes('h='), false)
	})

	it('a pushed h wins and stops tracking', async () => {
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['h', 'ps'], keys: ['h', 'sid'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ h: 'cdn.example' })
		reporter.decorate({ url: 'https://a.example.com/seg-1.m4s' })
		reporter.update({ sta: 'p', ts: 5 })
		await flushPromises()
		deepEqual(mock.bodies(), ['e=ps,h="cdn.example",sid="s",sta=p,ts=5,v=2'])
	})

	it('derives bg from document visibility, one b line per reporter', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const fake = installDocument(context, 'visible')
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['b', 't'], keys: ['bg', 'cid', 'sid'], interval: 1 }] })
		session.createReporter({ cid: 'a' })
		session.createReporter({ cid: 'b' })
		equal(fake.listeners.size, 1)
		fake.visibilityState = 'hidden'
		fake.listeners.forEach(listener => listener())
		context.mock.timers.tick(1000)
		fake.visibilityState = 'visible'
		fake.listeners.forEach(listener => listener())
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(mock.bodies(), [
			'bg,cid="a",e=b,sid="s",ts=1000,v=2',
			'bg,cid="b",e=b,sid="s",ts=1000,v=2',
			'bg,cid="a",e=t,sid="s",ts=2000,v=2',
			'bg,cid="b",e=t,sid="s",ts=2000,v=2',
			'cid="a",e=b,sid="s",ts=2000,v=2',
			'cid="b",e=b,sid="s",ts=2000,v=2',
			'cid="a",e=t,sid="s",ts=3000,v=2',
			'cid="b",e=t,sid="s",ts=3000,v=2',
		])
		session.dispose()
		equal(fake.listeners.size, 0)
	})

	it('takes the initial visibility without emitting, and a pushed bg stops the listener', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1000 })
		const fake = installDocument(context, 'hidden')
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: ['b', 'ps'], keys: ['bg', 'sid'], interval: 0 }] })
		const reporter = session.createReporter()
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ bg: false, ts: 2 })
		equal(fake.listeners.size, 0)
		fake.visibilityState = 'visible'
		await flushPromises()
		deepEqual(mock.bodies(), ['bg,e=ps,sid="s",sta=p,ts=1,v=2', 'e=b,sid="s",ts=2,v=2'])
	})

	it('installs no listener with derive.bg off', (context) => {
		const fake = installDocument(context, 'visible')
		const session = createCmcdSession({ sid: 's', derive: { bg: false } })
		equal(fake.listeners.size, 0)
		session.dispose()
	})
})
