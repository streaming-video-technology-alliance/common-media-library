# Prototype: option 2

Reference code for [option-2.md](../option-2.md) and [the RFC](../../../rfc/cmcd-session.md). It is not production code. The `#cmcd/` imports point to `libs/cmcd/src`. The repository typecheck covers every `.ts` file, so this folder keeps the code as a listing.

## createCmcdSession.ts

```ts
/**
 * Option 2 prototype: a new CMCD API next to an unchanged CmcdReporter.
 *
 * One session is one sid. The session keeps only the state CTA-5004-B scopes
 * to a session or a destination: one sn per destination, the data each
 * destination receives once, the event queues, and the t timers.
 * The player passes the full data on every call. Names follow CmcdReporter.
 */
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from '#cmcd/CMCD_MIME_TYPE.ts'
import type { Cmcd } from '#cmcd/Cmcd.ts'
import type { CmcdEventType } from '#cmcd/CmcdEventType.ts'
import type { CmcdHeaderMap } from '#cmcd/CmcdHeaderMap.ts'
import type { CmcdKey } from '#cmcd/CmcdKey.ts'
import type { CmcdRequestReport } from '#cmcd/CmcdRequestReport.ts'
import type { CmcdTransmissionMode } from '#cmcd/CmcdTransmissionMode.ts'
import type { CmcdVersion } from '#cmcd/CmcdVersion.ts'
import { encodePreparedCmcd } from '#cmcd/encodePreparedCmcd.ts'
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

const CMCD_QUERY_PARAM = /([?&])CMCD=[^&#]*&?/
const MAX_QUEUE = 500

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

function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const { url, ...init } = request
	return fetch(url, { ...init, keepalive: true })
}

export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number }> = defaultRequester): CmcdSession {
	const sid = config.sid || uuid()
	const timeOrigin = performance.timeOrigin
	const settings: CmcdSessionSettings = { version: 2, ...config }
	const requestDestination: Destination = { sn: 0, pending: {} }
	const eventDestinations: EventDestination[] = (config.eventTargets || []).map((target) => ({ target, sn: 0, pending: {}, keys: target.enabledKeys, queue: [], gone: false }))
	const all: Destination[] = [requestDestination, ...eventDestinations]

	function prepare(destination: Destination, data: Cmcd, reportingMode: 'request' | 'event', keys?: readonly CmcdKey[], baseUrl?: string): Cmcd {
		const prepared = prepareCmcdData({ cid: config.cid, ...data, msd: undefined, ...destination.pending, sid, sn: destination.sn }, {
			version: reportingMode === 'event' ? 2 : settings.version,
			reportingMode,
			filter: keys && ((key) => keys.includes(key)),
			baseUrl,
		})

		destination.sn++
		destination.pending = {}

		return prepared
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

	function selects(destination: EventDestination, type: CmcdEventType, data: Cmcd, request?: Readonly<HttpRequest>): boolean {
		const { target } = destination

		return !destination.gone && target.events.includes(type) && (!target.filter || target.filter({ ...data, e: type }, request))
	}

	function emit(destination: EventDestination, type: CmcdEventType, data: Cmcd): void {
		destination.queue.push(encodePreparedCmcd(prepare(destination, { ...data, e: type, ts: data.ts ?? Date.now() }, 'event', destination.keys)))
		destination.queue.splice(0, destination.queue.length - MAX_QUEUE)

		if (destination.queue.length >= (destination.target.batchSize || 1)) {
			send(destination)
		}
	}

	const session: CmcdSession = {
		sid,

		createRequestReport(request, data = {}) {
			const cmcd = prepare(requestDestination, data, 'request', settings.enabledKeys, request.url)
			const report = { ...request, headers: { ...request.headers }, customData: { ...request.customData, cmcd } }

			if (settings.transmissionMode === 'headers') {
				Object.assign(report.headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				const base = withoutCmcdParam(request.url)
				const encoded = encodePreparedCmcd(cmcd)
				report.url = encoded ? base.replace(/(#|$)/, `${base.includes('?') ? '&' : '?'}${new URLSearchParams({ CMCD: encoded })}$1`) : base
			}

			return report as typeof request & CmcdRequestReport<(typeof request)['customData']>
		},

		recordEvent(type, data = {}, request) {
			const selected = eventDestinations.filter((destination) => selects(destination, type, data, request))

			for (const destination of selected) {
				emit(destination, type, data)
			}
		},

		recordResponseReceived(response, data = {}) {
			const { request } = response
			const url = data.url ?? request?.url

			if (!url) {
				return
			}

			const derived: Cmcd = { url: withoutCmcdParam(url), rc: response.status }
			const timing = response.resourceTiming

			if (timing?.startTime != null) {
				derived.ts = Math.round(timeOrigin + timing.startTime)

				if (timing.responseStart != null) {
					derived.ttfb = Math.round(timing.responseStart - timing.startTime)
				}
			}

			if (timing?.duration != null) {
				derived.ttlb = Math.round(timing.duration)
			}

			session.recordEvent('rr', { ...request?.customData?.cmcd, ...derived, ...data }, request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			for (const destination of all) {
				if (destination !== requestDestination && (destination as EventDestination).target.events.includes('e')) {
					if (selects(destination as EventDestination, 'e', { ...data, ec })) {
						emit(destination as EventDestination, 'e', { ...data, ec })
					}
				}
				else {
					merge(destination.pending as Record<string, unknown>, { ec })
				}
			}
		},

		includeOnce(data) {
			for (const destination of all) {
				merge(destination.pending as Record<string, unknown>, data as Record<string, unknown>)
			}
		},

		configure(next) {
			Object.assign(settings, next)
		},

		start(immediate = true) {
			const { snapshot } = config

			for (const destination of eventDestinations) {
				clearInterval(destination.timer)
				const interval = destination.target.interval ?? 30

				if (snapshot && interval > 0 && !destination.gone && destination.target.events.includes('t')) {
					const tick = () => {
						const data = snapshot()

						if (selects(destination, 't', data)) {
							emit(destination, 't', data)
						}
					}

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
