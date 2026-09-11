import type { CmcdEventType, CmcdKey } from '@svta/cml-cmcd'
import { createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { EX_8_2_4, EX_8_2_6, EX_8_2_7, EX_8_2_8 } from './data/CTA_5004_B_EXAMPLES.ts'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'

/** One session, one event target that sends at once, and one reporter. Omit `cid` for a reporter without a content ID. */
function harness(events: CmcdEventType[], keys: CmcdKey[], cid?: string) {
	const mock = createMockRequester()
	const session = createCmcdSession({ sid: 'session-id-123', requester: mock.requester, eventTargets: [{ url: COLLECTOR, events, keys, interval: 0 }] })
	const reporter = session.createReporter(cid === undefined ? {} : { cid })
	return { mock, session, reporter }
}

describe('CmcdSessionReporter events', () => {
	it('reproduces 8.2.4: recordError emits e with the codes', async () => {
		const { mock, reporter } = harness(['e'], ['cid', 'ec', 'sid'], 'content-id-123')
		reporter.recordError('CODEC_NOT_SUPPORTED', { ts: 1764269150213 })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_4])
	})

	it('reproduces 8.2.6: a play-state change reports the merged store', async () => {
		const { mock, reporter } = harness(['ps'], ['bl', 'cid', 'pt', 'sid', 'sta'], 'content-id-123')
		reporter.update({ sta: 'k', bl: 0, pt: 30000, ts: 1764269150529 })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_6])
	})

	it('reproduces 8.2.7 and 8.2.8: discrete events with per-call data', async () => {
		const { mock, reporter } = harness(['sk', 'abs', 'as', 'ae', 'abe'], ['cid', 'nr', 'sid'], 'movie-123')
		reporter.recordEvent('sk', { cid: 'ad-content-555', ts: 1764269150076 })
		reporter.recordEvent('abs', { nr: true, ts: 1764269150186 })
		reporter.recordEvent('as', { cid: 'ad-001', ts: 1764269150934 })
		reporter.recordEvent('ae', { cid: 'ad-001', nr: true, ts: 1764269170901 })
		reporter.recordEvent('abe', { ts: 1764269170331 })
		await flushPromises()
		deepEqual(mock.bodies(), [EX_8_2_7, ...EX_8_2_8])
	})

	it('dedups state-change events and fires pr only while playing', async () => {
		const { mock, reporter } = harness(['ps', 'pr', 'bc', 'c'], ['br', 'cid', 'pr', 'sid', 'sta'])
		reporter.update({ sta: 'p', ts: 1 })
		reporter.update({ sta: 'p', ts: 2 })
		reporter.update({ pr: 2, ts: 3 })
		reporter.update({ sta: 'a', ts: 4 })
		reporter.update({ pr: 1, ts: 5 })
		reporter.update({ sta: 'p', ts: 6 })
		reporter.update({ br: { v: 3000 }, ts: 7 })
		reporter.update({ br: { v: 3000 }, ts: 8 })
		reporter.update({ br: { v: 3000, a: 128 }, ts: 9 })
		reporter.update({ cid: 'next', ts: 10 })
		await flushPromises()
		deepEqual(mock.bodies(), [
			'e=ps,sid="session-id-123",sta=p,ts=1,v=2',
			'e=pr,pr=2,sid="session-id-123",sta=p,ts=3,v=2',
			'e=ps,pr=2,sid="session-id-123",sta=a,ts=4,v=2',
			'e=ps,sid="session-id-123",sta=p,ts=6,v=2',
			'e=pr,pr=1,sid="session-id-123",sta=p,ts=6,v=2',
			'br=(3000;v),e=bc,sid="session-id-123",sta=p,ts=7,v=2',
			'br=(3000;v 128;a),e=bc,sid="session-id-123",sta=p,ts=9,v=2',
			'br=(3000;v 128;a),cid="next",e=c,sid="session-id-123",sta=p,ts=10,v=2',
		])
	})

	it('does not emit c for the cid given at creation, and emits ce with cen', async () => {
		const { mock, reporter } = harness(['c', 'ce'], ['cen', 'cid', 'sid'], 'content-id-123')
		reporter.update({ sf: 'd' })
		reporter.recordEvent('ce', { cen: 'seek-ui', ts: 5 })
		await flushPromises()
		deepEqual(mock.bodies(), ['cen="seek-ui",cid="content-id-123",e=ce,sid="session-id-123",ts=5,v=2'])
	})

	it('buffers error codes for a target that does not list e until its next report', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setInterval', 'setTimeout'], now: 1000 })
		const mock = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: mock.requester, eventTargets: [
			{ url: `${COLLECTOR}/errors`, events: ['e'], keys: ['ec', 'sid'] },
			{ url: `${COLLECTOR}/interval`, events: ['t'], keys: ['ec', 'sid'], interval: 1 },
		] })
		const reporter = session.createReporter()
		reporter.recordError(['E1', 'E2'])
		await flushPromises()
		deepEqual(mock.bodies(), ['e=e,ec=("E1" "E2"),sid="s",ts=1000,v=2'])
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(mock.bodies()[1], 'e=t,ec=("E1" "E2"),sid="s",ts=2000,v=2')
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(mock.bodies()[2], 'e=t,sid="s",ts=3000,v=2')
		session.dispose()
	})
})
