# Prototype: option 1

Reference code for [option-1.md](../option-1.md). It is not production code. The `#cmcd/` imports point to `libs/cmcd/src`. The repository typecheck covers every `.ts` file, so this folder keeps the code as a listing.

## createCmcdClient.ts

```ts
/**
 * Option 1 prototype: the CMCD client.
 *
 * Owns only the state CTA-5004-B scopes to a session or a destination:
 * sid, one sn per destination, the data each destination receives once
 * (msd, bs, bsd, buffered ec), the event queues, and the t timers.
 * The player passes the full data on every call.
 * A target can select the reports it receives with `filter`.
 */
import type { HttpRequest } from '@svta/cml-utils'
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from '#cmcd/CMCD_MIME_TYPE.ts'
import type { Cmcd } from '#cmcd/Cmcd.ts'
import type { CmcdEventType } from '#cmcd/CmcdEventType.ts'
import type { CmcdHeaderMap } from '#cmcd/CmcdHeaderMap.ts'
import type { CmcdKey } from '#cmcd/CmcdKey.ts'
import { encodePreparedCmcd } from '#cmcd/encodePreparedCmcd.ts'
import { prepareCmcdData } from '#cmcd/prepareCmcdData.ts'
import { toPreparedCmcdHeaders } from '#cmcd/toPreparedCmcdHeaders.ts'

export type CmcdClientTarget = {
	url: string
	events: readonly CmcdEventType[]
	keys?: readonly CmcdKey[]
	batchSize?: number
	interval?: number
	filter?: (data: Readonly<Cmcd>, request?: Readonly<HttpRequest>) => boolean
}

export type CmcdClientRequest = { url: string; headers?: Record<string, string> }

export type CmcdClientSettings = {
	version?: 1 | 2
	transmissionMode?: 'query' | 'headers'
	keys?: readonly CmcdKey[]
	headerMap?: Partial<CmcdHeaderMap>
}

export type CmcdClientRequester = (request: { url: string; method: string; headers: Record<string, string>; body: string }) => Promise<{ status: number }>

export type CmcdClientConfig = CmcdClientSettings & {
	sid?: string
	targets?: readonly CmcdClientTarget[]
	snapshot?: () => Cmcd
	requester?: CmcdClientRequester
}

type Destination = {
	sn: number
	pending: Cmcd
	keys?: readonly CmcdKey[]
}

type EventDestination = Destination & {
	target: CmcdClientTarget
	queue: string[]
	gone: boolean
	timer?: ReturnType<typeof setInterval>
}

export type CmcdClient = {
	readonly sid: string
	request(request: CmcdClientRequest, data?: Cmcd): CmcdClientRequest & { cmcd: Cmcd }
	event(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void
	error(codes: string | readonly string[], data?: Cmcd): void
	once(data: Cmcd): void
	configure(settings: CmcdClientSettings): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}

const CMCD_QUERY_PARAM = /([?&])CMCD=[^&#]*&?/

function merge(pending: Record<string, unknown>, data: Record<string, unknown>): void {
	for (const key in data) {
		const value = data[key]
		const prior = pending[key]
		pending[key] = Array.isArray(prior) && Array.isArray(value) ? [...prior, ...value] : value
	}
}

export function createCmcdClient(config: CmcdClientConfig = {}): CmcdClient {
	const sid = config.sid || uuid()
	const settings: CmcdClientSettings = { version: 2, ...config }
	const requester = config.requester || ((r) => fetch(r.url, { method: r.method, headers: r.headers, body: r.body, keepalive: true }))
	const requestDestination: Destination = { sn: 0, pending: {} }
	const eventDestinations: EventDestination[] = (config.targets || []).map((target) => ({ target, sn: 0, pending: {}, keys: target.keys, queue: [], gone: false }))
	const all: Destination[] = [requestDestination, ...eventDestinations]

	function prepare(destination: Destination, data: Cmcd, reportingMode: 'request' | 'event', keys?: readonly CmcdKey[], baseUrl?: string): Cmcd {
		const prepared = prepareCmcdData({ ...data, msd: undefined, ...destination.pending, sid, sn: destination.sn }, {
			version: reportingMode === 'event' ? 2 : settings.version,
			reportingMode,
			filter: keys && ((key) => keys.includes(key)),
			baseUrl,
		})

		destination.sn++

		for (const key in destination.pending) {
			if (key in prepared || (keys && !keys.includes(key as CmcdKey))) {
				delete (destination.pending as Record<string, unknown>)[key]
			}
		}

		return prepared
	}

	function send(destination: EventDestination): void {
		if (destination.gone || !destination.queue.length) {
			return
		}

		const lines = destination.queue.splice(0)
		const retry = () => destination.queue.unshift(...lines)

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

		if (destination.queue.length >= (destination.target.batchSize || 1)) {
			send(destination)
		}
	}

	const client: CmcdClient = {
		sid,

		request(request, data = {}) {
			const cmcd = prepare(requestDestination, data, 'request', settings.keys, request.url)

			if (settings.transmissionMode === 'headers') {
				return { url: request.url, headers: { ...request.headers, ...toPreparedCmcdHeaders(cmcd, settings.headerMap) }, cmcd }
			}

			const base = request.url.replace(CMCD_QUERY_PARAM, '$1').replace(/[?&](#|$)/, '$1')
			const encoded = encodePreparedCmcd(cmcd)
			const url = encoded ? base.replace(/(#|$)/, `${base.includes('?') ? '&' : '?'}${new URLSearchParams({ CMCD: encoded })}$1`) : base

			return { url, headers: request.headers, cmcd }
		},

		event(type, data = {}, request) {
			const selected = eventDestinations.filter((destination) => selects(destination, type, data, request))

			for (const destination of selected) {
				emit(destination, type, data)
			}
		},

		error(codes, data = {}) {
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

		once(data) {
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

	return client
}
```

## CmcdReporter.ts

```ts
/**
 * Option 1 prototype: CmcdReporter rebuilt on the client, with the 2.4.0 API and rules.
 *
 * Kept: the store, the automatic state-change events with deduplication,
 * start/stop/flush, createRequestReport, recordResponseReceived.
 * Dropped: transforms, session retention, the provenance record, the customData generic.
 * Added: `filter` on an event target selects the reports the target receives.
 * Added: configure() changes request settings without a new sid or sn.
 */
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { CMCD_STATE_EVENT_FIELDS } from '#cmcd/CMCD_STATE_EVENT_FIELDS.ts'
import type { Cmcd } from '#cmcd/Cmcd.ts'
import type { CmcdEventReportConfig } from '#cmcd/CmcdEventReportConfig.ts'
import type { CmcdEventType } from '#cmcd/CmcdEventType.ts'
import type { CmcdReporterConfig } from '#cmcd/CmcdReporterConfig.ts'
import type { CmcdRequestReport } from '#cmcd/CmcdRequestReport.ts'
import { toBareValue } from '#cmcd/toBareValue.ts'
import type { CmcdClient, CmcdClientSettings, CmcdClientTarget } from './createCmcdClient.ts'
import { createCmcdClient } from './createCmcdClient.ts'

type StateField = 'sta' | 'pr' | 'cid' | 'bg' | 'br'

export type CmcdReporterOptions = Omit<CmcdReporterConfig, 'eventTargets'> & {
	eventTargets?: (CmcdEventReportConfig & Pick<CmcdClientTarget, 'filter'>)[]
}

function listKey(value: unknown): unknown {
	const list = toBareValue(value)

	return Array.isArray(list) ? list.map((item) => `${toBareValue(item)};${Object.keys((item as { params?: object })?.params ?? {})}`).join() : value
}

function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const { url, ...init } = request
	return fetch(url, init)
}

export class CmcdReporter {
	private readonly config: Partial<CmcdReporterOptions>
	private readonly requester: (request: HttpRequest) => Promise<{ status: number }>
	private readonly timeOrigin = performance.timeOrigin
	private client: CmcdClient
	private data: Cmcd
	private lastEmitted: Partial<Record<StateField, unknown>>
	private msd = NaN
	private started = false

	constructor(config: Partial<CmcdReporterOptions>, requester: (request: HttpRequest) => Promise<{ status: number }> = defaultRequester) {
		this.config = config
		this.requester = requester
		this.data = { cid: config.cid, v: config.version || 2 }
		this.lastEmitted = { bg: false }
		this.client = this.createClient(config.sid)
	}

	private createClient(sid?: string): CmcdClient {
		const { config } = this

		return createCmcdClient({
			sid,
			version: config.version || 2,
			transmissionMode: config.transmissionMode === 'headers' ? 'headers' : 'query',
			keys: config.enabledKeys,
			headerMap: config.customHeaderMap,
			targets: (config.eventTargets || [])
				.filter((target) => target?.url && target.events?.length)
				.map((target) => ({ url: target.url, events: target.events!, keys: target.enabledKeys || [], batchSize: target.batchSize, interval: target.interval, filter: target.filter })),
			snapshot: () => this.data,
			requester: (request) => this.requester(request),
		})
	}

	start(): void {
		this.started = true
		this.client.start()
	}

	stop(flush: boolean = false): void {
		this.started = false

		if (flush) {
			this.client.flush()
		}

		this.client.stop()
	}

	flush(): void {
		this.client.flush()
	}

	configure(settings: CmcdClientSettings): void {
		this.client.configure(settings)
	}

	update(data: Partial<Cmcd>): void {
		if (data.sid && data.sid !== this.client.sid) {
			this.client.stop()
			this.client.flush()
			this.client = this.createClient(data.sid)
			this.lastEmitted = this.data.bg === true ? {} : { bg: false }
			this.msd = NaN

			if (this.started) {
				this.client.start(false)
			}
		}

		const { msd } = data

		if (typeof msd === 'number' && msd >= 0 && Math.round(msd) <= 999_999_999_999_999) {
			this.msd = Math.round(msd)
			this.client.once({ msd: this.msd })
		}

		this.data = { ...this.data, ...data, sid: undefined, msd: undefined }

		for (const [event, field] of CMCD_STATE_EVENT_FIELDS) {
			if (field in data) {
				this.recordEvent(event)
			}
		}
	}

	recordEvent(type: CmcdEventType, data: Partial<Cmcd> = {}): void {
		const field = CMCD_STATE_EVENT_FIELDS.get(type) as StateField | undefined

		if (field) {
			if (data[field] !== undefined) {
				this.data = { ...this.data, [field]: data[field] }
			}

			const current = this.data[field]
			const key = field === 'br' ? listKey(current) : current

			if (current === undefined || Object.is(key, this.lastEmitted[field])) {
				return
			}

			this.emit(type, data)
			this.lastEmitted[field] = key

			return
		}

		this.emit(type, data)
	}

	private emit(type: CmcdEventType, data: Partial<Cmcd>, request?: HttpRequest): void {
		const report = { ...this.data, ...data }

		if (type === 'b' && report.bg === false) {
			delete report.bg
		}

		this.client.event(type, report, request)
	}

	recordResponseReceived(response: HttpResponse<HttpRequest<{ cmcd?: Cmcd }>>, data: Partial<Cmcd> = {}): void {
		const { request } = response
		const url = data.url ?? request?.url

		if (!url) {
			return
		}

		const derived: Partial<Cmcd> = {
			url: url.replace(/([?&])CMCD=[^&#]*&?/, '$1').replace(/[?&](#|$)/, '$1'),
			rc: response.status,
		}
		const timing = response.resourceTiming

		if (timing?.startTime != null) {
			derived.ts = Math.round(this.timeOrigin + timing.startTime)

			if (timing.responseStart != null) {
				derived.ttfb = Math.round(timing.responseStart - timing.startTime)
			}
		}

		if (timing?.duration != null) {
			derived.ttlb = Math.round(timing.duration)
		}

		this.emit('rr', { ...request?.customData?.cmcd, ...derived, ...data }, request)
	}

	isRequestReportingEnabled(): boolean {
		return !!this.config.enabledKeys?.length
	}

	createRequestReport<R extends HttpRequest = HttpRequest>(request: R, data?: Partial<Cmcd>): R & CmcdRequestReport<R['customData']> {
		const report = { ...request, headers: { ...request.headers }, customData: { ...request.customData, cmcd: {} } } as R & CmcdRequestReport<R['customData']>

		if (!this.isRequestReportingEnabled() || !report.url) {
			return report
		}

		const decorated = this.client.request(report as { url: string; headers: Record<string, string> }, { ...this.data, ...data })

		report.url = decorated.url
		report.headers = decorated.headers as R['headers'] & Record<string, string>
		report.customData.cmcd = decorated.cmcd

		return report
	}
}
```
