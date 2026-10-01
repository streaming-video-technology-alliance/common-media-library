# Prototype: option 2

Reference code for [option-2.md](../option-2.md) and [the RFC](../../../rfc/cmcd-session.md). It is not production code. The `#cmcd/` imports point to `libs/cmcd/src` on the port branch. The repository typecheck covers every `.ts` file, so this folder keeps the code as a listing.

## createCmcdSession.ts

```ts
/**
 * Prototype of the CMCD session RFC (rfc/cmcd-session.md). CmcdReporter is deprecated.
 *
 * One session is one sid. The session keeps only the state CTA-5004-B scopes
 * to a session or a destination: one sn per destination, the data each
 * destination receives once, the event queues, and the t timers.
 * The player passes the full data on every call. A call builds and encodes
 * every report before it changes any state. `createCmcdSession()` and
 * `configure()` check the configuration first, so a failed check changes nothing.
 */
import type { HttpRequest, HttpResponse, ResourceTiming } from '@svta/cml-utils'
import { encodeSfDict } from '@svta/cml-structured-field-values'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from '#cmcd/CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_MIME_TYPE } from '#cmcd/CMCD_MIME_TYPE.ts'
import type { Cmcd } from '#cmcd/Cmcd.ts'
import { CmcdEventType } from '#cmcd/CmcdEventType.ts'
import type { CmcdHeaderMap } from '#cmcd/CmcdHeaderMap.ts'
import type { CmcdKey } from '#cmcd/CmcdKey.ts'
import type { CmcdRequestReport } from '#cmcd/CmcdRequestReport.ts'
import type { CmcdTransmissionMode } from '#cmcd/CmcdTransmissionMode.ts'
import type { CmcdVersion } from '#cmcd/CmcdVersion.ts'
import { encodePreparedCmcd } from '#cmcd/encodePreparedCmcd.ts'
import { getKeySpec } from '#cmcd/getKeySpec.ts'
import { prepareCmcdData } from '#cmcd/prepareCmcdData.ts'
import { toPreparedCmcdHeaders } from '#cmcd/toPreparedCmcdHeaders.ts'

/** Selects the reports an event target receives. `request` is set for `rr` reports and when the player passes one. */
export type CmcdReportFilter = (report: Readonly<Cmcd>, request?: Readonly<HttpRequest>) => boolean

export type CmcdSessionEventTarget = {
	url: string
	events: readonly CmcdEventType[]
	enabledKeys?: readonly CmcdKey[]
	batchSize?: number
	interval?: number
	filter?: CmcdReportFilter
}

export type CmcdSessionSettings = {
	version?: CmcdVersion
	transmissionMode?: CmcdTransmissionMode
	enabledKeys?: readonly CmcdKey[]
	customHeaderMap?: Partial<CmcdHeaderMap>
}

export type CmcdSessionConfig = CmcdSessionSettings & {
	sid?: string
	cid?: string
	eventTargets?: readonly CmcdSessionEventTarget[]
	snapshot?: () => Cmcd
}

export type CmcdSession = {
	readonly sid: string
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void
	recordResponseReceived(response: HttpResponse, data?: Cmcd): void
	recordError(codes: string | readonly string[], data?: Cmcd): void
	includeOnce(data: Cmcd): void
	configure(settings: CmcdSessionSettings): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}

type Destination = {
	sn: number
	pending: Cmcd
	keys?: readonly CmcdKey[]
}

type EventDestination = Destination & {
	target: CmcdSessionEventTarget
	queue: string[]
	gone: boolean
	timer?: ReturnType<typeof setInterval>
}

/** The members of a `PerformanceResourceTiming` entry that `recordResponseReceived()` reads. `ResourceTiming` has no `responseEnd` yet. */
type ResponseTiming = Partial<ResourceTiming> & { responseEnd?: number }

const CMCD_QUERY_PARAM = /([?&])CMCD=[^&#]*&?/
const MAX_QUEUE = 500
const MAX_INTEGER = 999_999_999_999_999
// The implementation adds CMCD_EVENT_HOSTNAME ('h') to CmcdEventType, so the literal 'h' goes away there.
const EVENT_TYPES: readonly string[] = [...Object.values(CmcdEventType), 'h']

function withoutCmcdParam(url: string): string {
	return url.replace(CMCD_QUERY_PARAM, '$1').replace(/[?&](#|$)/, '$1')
}

function merge(pending: Record<string, unknown>, data: Record<string, unknown>): void {
	for (const key in data) {
		const value = data[key]
		const prior = pending[key]
		pending[key] = Array.isArray(prior) && Array.isArray(value) ? [...prior, ...value] : value
	}
}

/** Throws when a value cannot be serialized, so a waiting key can never fail a later report. */
function assertEncodable(data: Cmcd): void {
	encodeSfDict(Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)))
}

function configError(parameter: string, expected: string, received: unknown): Error {
	return new Error(`createCmcdSession: ${parameter} must be ${expected}, received ${typeof received === 'string' ? JSON.stringify(received) : String(received)}`)
}

function checkKeys(parameter: string, keys: readonly string[] | undefined): void {
	for (const key of keys ?? []) {
		if (typeof key !== 'string' || getKeySpec(key) === undefined) {
			throw configError(parameter, 'a CMCD key or a custom key with a hyphen', key)
		}
	}
}

/** Checks the settings that `createCmcdSession()` and `configure()` share. */
function checkSettings({ version, transmissionMode, enabledKeys, customHeaderMap }: CmcdSessionSettings): void {
	if (version !== undefined && version !== 1 && version !== 2) {
		throw configError('version', '1 or 2', version)
	}

	if (transmissionMode !== undefined && transmissionMode !== 'query' && transmissionMode !== 'headers') {
		throw configError('transmissionMode', '"query" or "headers"', transmissionMode)
	}

	checkKeys('enabledKeys', enabledKeys)

	for (const keys of Object.values(customHeaderMap ?? {})) {
		checkKeys('customHeaderMap', keys)
	}
}

function checkTarget({ url, events, enabledKeys, interval, batchSize }: CmcdSessionEventTarget, parameter: string): void {
	if (typeof url !== 'string' || url === '') {
		throw configError(`${parameter}.url`, 'a URL', url)
	}

	if (!Array.isArray(events)) {
		throw configError(`${parameter}.events`, 'CMCD event types', events)
	}

	for (const event of events) {
		if (!EVENT_TYPES.includes(event)) {
			throw configError(`${parameter}.events`, 'CMCD event types', event)
		}
	}

	checkKeys(`${parameter}.enabledKeys`, enabledKeys)

	if (interval !== undefined && !(Number.isFinite(interval) && interval >= 0)) {
		throw configError(`${parameter}.interval`, 'a finite number of seconds, 0 or more', interval)
	}

	if (batchSize !== undefined && !(Number.isInteger(batchSize) && batchSize > 0)) {
		throw configError(`${parameter}.batchSize`, 'a positive integer', batchSize)
	}
}

function checkConfig(config: CmcdSessionConfig): void {
	const { sid, cid, eventTargets } = config

	if (sid !== undefined && (typeof sid !== 'string' || sid === '' || sid.length > 64)) {
		throw configError('sid', 'a string of 1 to 64 characters', sid)
	}

	if (cid !== undefined && (typeof cid !== 'string' || cid.length > 128)) {
		throw configError('cid', 'a string of at most 128 characters', cid)
	}

	checkSettings(config)
	eventTargets?.forEach((target, i) => checkTarget(target, `eventTargets[${i}]`))
}

function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const { url, ...init } = request
	return fetch(url, { ...init, keepalive: true })
}

export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number }> = defaultRequester): CmcdSession {
	checkConfig(config)

	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin
	const settings: CmcdSessionSettings = { version: 2, ...config }
	const requestDestination: Destination = { sn: 0, pending: {} }
	const eventDestinations: EventDestination[] = (config.eventTargets || []).map((target) => ({ target, sn: 0, pending: {}, keys: target.enabledKeys, queue: [], gone: false }))
	const all: Destination[] = [requestDestination, ...eventDestinations]

	function build(destination: Destination, data: Cmcd, reportingMode: 'request' | 'event', keys?: readonly CmcdKey[], baseUrl?: string): Cmcd {
		return prepareCmcdData({ cid: config.cid, ...data, msd: undefined, ...destination.pending, sid, sn: destination.sn }, {
			version: reportingMode === 'event' ? 2 : settings.version,
			reportingMode,
			filter: keys && ((key) => keys.includes(key)),
			baseUrl,
		})
	}

	function commit(destination: Destination): void {
		destination.sn++
		destination.pending = {}
	}

	function send(destination: EventDestination): void {
		if (destination.gone || !destination.queue.length) {
			return
		}

		const lines = destination.queue.splice(0)
		const retry = () => {
			destination.queue.unshift(...lines)
			destination.queue.splice(0, destination.queue.length - MAX_QUEUE)
		}

		requester({ url: destination.target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }).then(({ status }) => {
			if (status === 410) {
				for (const sibling of eventDestinations) {
					if (sibling.target.url === destination.target.url) {
						sibling.gone = true
						sibling.queue.length = 0
						clearInterval(sibling.timer)
					}
				}
			}
			else if (status === 429 || status > 499) {
				retry()
			}
		}, retry)
	}

	function emit(candidates: readonly EventDestination[], type: CmcdEventType, data: Cmcd, request?: Readonly<HttpRequest>): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === 'b' && report.bg === false) {
			delete report.bg
		}

		const selected = candidates.filter(({ gone, target }) => !gone && target.events.includes(type) && (!target.filter || target.filter(report, request)))
		const lines = selected.map((destination) => encodePreparedCmcd(build(destination, report, 'event', destination.keys)))

		selected.forEach((destination, i) => {
			commit(destination)
			destination.queue.push(lines[i])
			destination.queue.splice(0, destination.queue.length - MAX_QUEUE)

			if (destination.queue.length >= (destination.target.batchSize || 1)) {
				send(destination)
			}
		})
	}

	const session: CmcdSession = {
		sid,

		createRequestReport(request, data = {}) {
			const cmcd = build(requestDestination, data, 'request', settings.enabledKeys, request.url)
			const report = { ...request, headers: { ...request.headers }, customData: { ...request.customData, cmcd } }

			if (settings.transmissionMode === 'headers') {
				Object.assign(report.headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				const base = withoutCmcdParam(request.url)
				const encoded = encodePreparedCmcd(cmcd)
				report.url = encoded ? base.replace(/(#|$)/, `${base.includes('?') ? '&' : '?'}${new URLSearchParams({ CMCD: encoded })}$1`) : base
			}

			commit(requestDestination)

			return report as typeof request & CmcdRequestReport<(typeof request)['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(eventDestinations, type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const { request } = response
			const url = data.url ?? request?.url

			if (!url) {
				return
			}

			const derived: Cmcd = { url: withoutCmcdParam(url), rc: response.status }
			const { startTime, responseStart = 0, responseEnd = 0, duration = 0 }: ResponseTiming = response.resourceTiming ?? {}

			if (typeof startTime === 'number') {
				derived.ts = Math.round(timeOrigin + startTime)

				if (responseStart > 0 && responseStart >= startTime) {
					derived.ttfb = Math.round(responseStart - startTime)
				}
			}

			if (duration > 0) {
				derived.ttlb = Math.round(duration)
			}
			else if (typeof startTime === 'number' && responseEnd > startTime) {
				derived.ttlb = Math.round(responseEnd - startTime)
			}

			emit(eventDestinations, 'rr', { ...request?.customData?.cmcd, ...derived, ...data }, request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]
			assertEncodable({ ec })

			const errorTargets = eventDestinations.filter((destination) => destination.target.events.includes('e'))
			emit(errorTargets, 'e', { ...data, ec })

			for (const destination of all) {
				if (!errorTargets.includes(destination as EventDestination)) {
					merge(destination.pending as Record<string, unknown>, { ec })
				}
			}
		},

		includeOnce(data) {
			const { msd, ...rest } = data
			const keys: Cmcd = rest

			if (typeof msd === 'number' && msd >= 0 && Math.round(msd) <= MAX_INTEGER) {
				keys.msd = Math.round(msd)
			}

			assertEncodable(keys)

			for (const destination of all) {
				merge(destination.pending as Record<string, unknown>, keys as Record<string, unknown>)
			}
		},

		configure(next) {
			checkSettings(next)
			Object.assign(settings, next)
		},

		start(immediate = true) {
			const { snapshot } = config

			for (const destination of eventDestinations) {
				clearInterval(destination.timer)
				const interval = destination.target.interval ?? CMCD_DEFAULT_TIME_INTERVAL

				if (snapshot && interval > 0 && !destination.gone && destination.target.events.includes('t')) {
					const tick = () => emit([destination], 't', snapshot())

					destination.timer = setInterval(tick, interval * 1000)

					if (immediate) {
						tick()
					}
				}
			}
		},

		stop() {
			eventDestinations.forEach((destination) => clearInterval(destination.timer))
		},

		flush() {
			eventDestinations.forEach(send)
		},
	}

	return session
}
```
