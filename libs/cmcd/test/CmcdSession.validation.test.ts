import type { CmcdSession, CmcdValidationIssue, CmcdValidationResult } from '@svta/cml-cmcd'
import { CmcdTransmissionMode, CmcdValidationSeverity, createCmcdSession, validateCmcdEvents, validateCmcdRequest } from '@svta/cml-cmcd'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it, type TestContext } from 'node:test'
import { createMockRequester, flushPromises } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'
const START = 1764752370000
const SWEPT_EVENTS = ['ps', 'pr', 'c', 'b', 'bc', 't', 'rr', 'e', 'h', 'ce', 'sk', 'as', 'ae', 'abs', 'abe', 'm', 'um', 'pe', 'pc'] as const

/**
 * The exit from backgrounded mode is a bare `e=b` line. CTA-5004-B asks a player to send
 * `bg` only when the value is true, so the exit carries no `bg`. `validateCmcdStructure`
 * on this branch still requires `bg` on every `b` event. The fix is on the branch
 * `fix/cmcd-validator-b-event-without-bg`. Delete this exclusion when that fix lands.
 */
const BACKGROUND_EXIT_ISSUE = 'State-change event (e="b") requires the "bg" key to be present.'

const BACKGROUND_EVENT = /(^|,)e=b(,|$)/
const BACKGROUND_KEY = /(^|,)bg(,|$)/
const EVENT_TOKEN = /(^|,)e=([a-z]+)(,|$)/

type SweptRequest = { readonly url: string; readonly headers?: Readonly<Record<string, string>> }

/** The error issues of a result, without the one issue of the known validator gap. */
function errorsOf(result: CmcdValidationResult): CmcdValidationIssue[] {
	return result.issues.filter(issue => issue.severity === CmcdValidationSeverity.ERROR && issue.message !== BACKGROUND_EXIT_ISSUE)
}

/** How many issues the known validator gap produced. */
function gapCountOf(result: CmcdValidationResult): number {
	return result.issues.filter(issue => issue.message === BACKGROUND_EXIT_ISSUE).length
}

/** Every emitted line that is a `b` event without `bg`. */
function backgroundExitLines(bodies: readonly string[]): string[] {
	return bodies.flatMap(body => body.split('\n')).filter(line => BACKGROUND_EVENT.test(line) && !BACKGROUND_KEY.test(line))
}

/** Drives one session through every line kind the session API emits. Returns the decorated requests. */
function drive(context: TestContext, session: CmcdSession): SweptRequest[] {
	const primary = session.createReporter({ cid: 'movie-42' })
	const requests: SweptRequest[] = []
	primary.update({ sf: 'd', st: 'v', sta: 's', bl: 0, mtp: 15000, ts: START })
	requests.push(primary.decorate({ url: `${CDN}/manifest.mpd` }, { ot: 'm' }))
	const init = primary.decorate({ url: `${CDN}/init.m4v` }, { ot: 'i', br: { v: 3000, a: 128 }, nor: [`${CDN}/seg-1.m4v`, { url: `${CDN}/seg-2.m4v`, range: '0-999' }] })
	requests.push(init)
	primary.recordResponse(init, { status: 200, headers: { 'CMSD-Static': 'ot=i' }, timing: { startTime: 10, responseStart: 40, responseEnd: 90 } })
	primary.update({ sta: 'p', bl: 4000, pr: 1, ts: START + 500 })
	primary.update({ pr: 1.5, br: { v: 4200, a: 256 }, tb: { v: 6000, a: 350 }, pt: 1000 })
	primary.recordError('MEDIA_ERR_NETWORK')
	primary.update({ sta: 'r', ts: START + 1000 })
	context.mock.timers.tick(1000)
	primary.update({ sta: 'p', ts: START + 1800 })
	primary.recordEvent('m')
	primary.recordEvent('um')
	primary.recordEvent('pe')
	primary.recordEvent('pc')
	const ad = session.createReporter({ cid: 'ad-7' })
	ad.update({ nr: true, sta: 'p' })
	primary.recordEvent('abs')
	ad.recordEvent('as')
	requests.push(ad.decorate({ url: `${CDN}/ad-1.m4v` }, { ot: 'v', d: 4000 }))
	ad.recordEvent('ce', { cen: 'ad-quartile' })
	ad.recordEvent('sk')
	ad.recordEvent('ae')
	ad.dispose()
	primary.recordEvent('abe')
	primary.update({ bg: true })
	primary.update({ bg: false })
	primary.update({ cid: 'movie-43', sta: 'e' })
	context.mock.timers.tick(1000)
	session.rotate('session-id-456')
	primary.update({ sta: 's', ts: START + 3000 })
	requests.push(primary.decorate({ url: `${CDN}/seg-9.m4v` }, { ot: 'v', d: 4000, rtp: 12000, 'com.example-tag': 'x' }))
	session.dispose()
	return requests
}

/**
 * Runs both validators over everything the session sent and everything it decorated.
 * Event mode is always version 2. `version` is the version key the requests carry.
 */
function sweep(bodies: readonly string[], requests: readonly SweptRequest[], version: number | undefined): void {
	const lines = bodies.flatMap(body => body.split('\n'))
	ok(lines.length >= 15, `expected many reports, got ${lines.length}`)
	deepEqual([...new Set(lines.map(line => EVENT_TOKEN.exec(line)?.[2]))].sort(), [...SWEPT_EVENTS].sort(), 'the sweep missed an event type')

	let gaps = 0
	for (const body of bodies) {
		const result = validateCmcdEvents(body)
		gaps += gapCountOf(result)
		deepEqual(errorsOf(result), [], `invalid body: ${body}`)
		for (const data of result.data) {
			equal(data.v, 2, `event line is not version 2: ${body}`)
		}
	}
	for (const request of requests) {
		const result = validateCmcdRequest({ url: request.url, headers: request.headers ? { ...request.headers } : undefined })
		deepEqual(errorsOf(result), [], `invalid request: ${request.url}`)
		equal(result.data.v, version, `wrong version on request: ${request.url}`)
	}

	const exits = backgroundExitLines(bodies)
	equal(exits.length, 1, `expected one background exit line, got ${exits.length}`)
	equal(gaps, 1, `expected one excluded issue, got ${gaps}`)
}

describe('CmcdSession validation sweep', () => {
	for (const transmissionMode of [CmcdTransmissionMode.QUERY, CmcdTransmissionMode.HEADERS]) {
		it(`emits only valid reports in ${transmissionMode} mode`, async (context) => {
			context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: START })
			const mock = createMockRequester()
			const session = createCmcdSession({ sid: 'session-id-123', transmissionMode, requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: [...SWEPT_EVENTS], interval: 1 }] })
			const requests = drive(context, session)
			await flushPromises()

			sweep(mock.bodies(), requests, 2)
			equal(session.sid, 'session-id-456')
		})

		it(`emits only valid version 1 reports in ${transmissionMode} mode`, async (context) => {
			context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: START })
			const mock = createMockRequester()
			const session = createCmcdSession({ sid: 'session-id-123', version: 1, transmissionMode, requester: mock.requester, eventTargets: [{ url: COLLECTOR, events: [...SWEPT_EVENTS], interval: 1 }] })
			const requests = drive(context, session)
			await flushPromises()

			sweep(mock.bodies(), requests, undefined)
			equal(session.sid, 'session-id-456')
		})
	}
})
