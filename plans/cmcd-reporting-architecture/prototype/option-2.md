# Prototype: option 2

Reference code for [option-2.md](../option-2.md) and [the RFC](../../../rfc/cmcd-session.md). It is not production code. The `#cmcd/` imports point to `libs/cmcd/src` on the port branch. The repository typecheck covers every `.ts` file, so this folder keeps the code as a listing.

> [!NOTE]
> This listing is the code behind the measurements of the RFC, and it stays unchanged. The review of the RFC PR found five gaps in it. The RFC fixes them, and the Phase 3 plan tests them:
>
> - The code removes only the first `CMCD` query parameter. The RFC removes every one.
> - A waiting `bsd` keeps the array of the caller. The RFC copies each waiting value.
> - A requester that throws at once loses its batch, and later targets of the same call lose their reports. The RFC treats the throw as a rejected request.
> - A target that a 410 stopped keeps collecting waiting values. The RFC clears them.
> - `CmcdReportFilter` uses `Readonly`. The RFC uses `DeepReadonly`.

## createCmcdSession.ts

```ts
/**
 * Prototype of the CMCD session RFC (rfc/cmcd-session.md). CmcdReporter is deprecated.
 *
 * One session is one sid. The session keeps only the state CTA-5004-B scopes
 * to a session or a destination: one sn per destination, the msd gate, the
 * bs, bsd, and ec values that wait for the next report of each destination,
 * the event queues, and the t timers.
 * The player passes the full data on every call. A call builds and encodes
 * every report before it changes any state. `createCmcdSession()` checks the
 * configuration first.
 */
import type { HttpRequest, HttpResponse, ResourceTiming } from '@svta/cml-utils'
import { encodeSfDict } from '@svta/cml-structured-field-values'
import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from '#cmcd/CMCD_DEFAULT_TIME_INTERVAL.ts'
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
	configure(settings: CmcdSessionSettings): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}

type Destination = {
	sn: number
	waiting: Cmcd
	msdSent: boolean
	keys?: readonly CmcdKey[]
}

type EventDestination = Destination & {
	target: CmcdSessionEventTarget
	queue: string[]
	gone: boolean
	timer?: ReturnType<typeof setInterval>
	delay: number
	retry?: ReturnType<typeof setTimeout>
}

/** The values of one call that reach every destination: the first valid msd, and the bs, bsd, and ec values. */
type Scoped = {
	msd?: number
	values: Cmcd
}

const CMCD_QUERY_PARAM = /([?&])CMCD=[^&#]*&?/
const MAX_INTEGER = 999_999_999_999_999
const MAX_DELAY = 60_000
const SCOPED_KEYS = ['msd', 'bs', 'bsd', 'ec'] as const

function withoutCmcdParam(url: string): string {
	return url.replace(CMCD_QUERY_PARAM, '$1').replace(/[?&](#|$)/, '$1')
}

function merge(waiting: Record<string, unknown>, values: Record<string, unknown>): Record<string, unknown> {
	for (const key in values) {
		const value = values[key]
		const prior = waiting[key]
		waiting[key] = Array.isArray(prior) ? [...prior, ...(Array.isArray(value) ? value : [value])] : value
	}

	return waiting
}

function configError(parameter: string, expected: string, received: unknown): Error {
	return new Error(`createCmcdSession: ${parameter} must be ${expected}, received ${typeof received === 'string' ? JSON.stringify(received) : String(received)}`)
}

function checkConfig({ sid, cid, eventTargets }: CmcdSessionConfig): void {
	if (sid !== undefined && (typeof sid !== 'string' || sid === '' || sid.length > 64)) {
		throw configError('sid', 'a string of 1 to 64 characters', sid)
	}

	if (cid !== undefined && (typeof cid !== 'string' || cid.length > 128)) {
		throw configError('cid', 'a string of at most 128 characters', cid)
	}

	eventTargets?.forEach(({ url, interval, batchSize }, i) => {
		if (typeof url !== 'string' || url === '') {
			throw configError(`eventTargets[${i}].url`, 'a URL', url)
		}

		if (interval !== undefined && !(Number.isFinite(interval) && interval >= 0)) {
			throw configError(`eventTargets[${i}].interval`, 'a finite number of seconds, 0 or more', interval)
		}

		if (batchSize !== undefined && !(Number.isInteger(batchSize) && batchSize > 0)) {
			throw configError(`eventTargets[${i}].batchSize`, 'a positive integer', batchSize)
		}
	})
}

function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const { url, ...init } = request
	return fetch(url, init)
}

export function createCmcdSession(config: CmcdSessionConfig = {}, requester: (request: HttpRequest) => Promise<{ status: number }> = defaultRequester): CmcdSession {
	checkConfig(config)

	const sid = config.sid ?? uuid()
	const timeOrigin = performance.timeOrigin
	const settings: CmcdSessionSettings = { version: 2, ...config }
	const requestDestination: Destination = { sn: 0, waiting: {}, msdSent: false }
	const eventDestinations: EventDestination[] = (config.eventTargets || []).map((target) => ({ target, sn: 0, waiting: {}, msdSent: false, keys: target.enabledKeys, queue: [], gone: false, delay: 0 }))
	const all: Destination[] = [requestDestination, ...eventDestinations]
	let msd: number | undefined
	let stopped = false

	/** Reads the values of a call that every destination receives. Throws when one of them cannot be serialized. */
	function scope(data: Cmcd, extra?: Cmcd): Scoped {
		const values: Cmcd = { ...extra }

		if (data.bs === true) {
			values.bs = true
		}

		if (data.bsd != null) {
			values.bsd = data.bsd
		}

		if (values.bsd !== undefined || values.ec !== undefined) {
			encodeSfDict(values as Record<string, unknown>)
		}

		const value = data.msd
		const valid = msd === undefined && typeof value === 'number' && value >= 0 && Math.round(value) <= MAX_INTEGER

		return { msd: valid ? Math.round(value) : undefined, values }
	}

	function build(destination: Destination, data: Cmcd, scoped: Scoped, reportingMode: 'request' | 'event', keys?: readonly CmcdKey[], baseUrl?: string): Cmcd {
		const waiting = merge({ ...destination.waiting }, scoped.values as Record<string, unknown>)

		return prepareCmcdData({ cid: config.cid, ...data, msd: destination.msdSent ? undefined : msd ?? scoped.msd, ...waiting, sid, sn: destination.sn }, {
			version: reportingMode === 'event' ? 2 : settings.version,
			reportingMode,
			filter: keys && ((key) => keys.includes(key)),
			baseUrl,
		})
	}

	/** The destinations that reported take their waiting values. Every other destination receives the values of the call. */
	function commit(reported: readonly Destination[], prepared: readonly Cmcd[], scoped: Scoped): void {
		msd ??= scoped.msd

		for (const destination of all) {
			const i = reported.indexOf(destination)

			if (i < 0) {
				merge(destination.waiting as Record<string, unknown>, scoped.values as Record<string, unknown>)
			}
			else {
				destination.sn++
				destination.waiting = {}
				destination.msdSent ||= prepared[i].msd !== undefined
			}
		}
	}

	/** Sends the queue of a target. A target that waits after a failure sends only when `force` is set. */
	function send(destination: EventDestination, force?: boolean): void {
		if (destination.gone || !destination.queue.length || (destination.retry && !force)) {
			return
		}

		clearTimeout(destination.retry)
		destination.retry = undefined

		const lines = destination.queue.splice(0)

		// CTA-5004-B: back off after a 429 or 5xx response.
		const backOff = () => {
			destination.queue.unshift(...lines)
			destination.delay = Math.min(destination.delay * 2 || 1000, MAX_DELAY)

			if (!stopped && !destination.gone) {
				clearTimeout(destination.retry)
				destination.retry = setTimeout(() => {
					destination.retry = undefined
					send(destination)
				}, destination.delay)
			}
		}

		requester({ url: destination.target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }).then(({ status }) => {
			if (status === 410) {
				for (const sibling of eventDestinations) {
					if (sibling.target.url === destination.target.url) {
						sibling.gone = true
						sibling.queue.length = 0
						clearInterval(sibling.timer)
						clearTimeout(sibling.retry)
					}
				}
			}
			else if (status === 429 || status > 499) {
				backOff()
			}
			else {
				destination.delay = 0
			}
		}, backOff)
	}

	function emit(type: CmcdEventType, data: Cmcd, request?: Readonly<HttpRequest>, candidates: readonly EventDestination[] = eventDestinations, extra?: Cmcd): void {
		const report: Cmcd = { ...data, e: type, ts: data.ts ?? Date.now() }

		// CTA-5004-B: a b event without bg is the exit from backgrounded mode.
		if (type === 'b' && report.bg === false) {
			delete report.bg
		}

		const scoped = scope(report, extra)
		const selected = candidates.filter(({ gone, target }) => !gone && target.events.includes(type) && (!target.filter || target.filter(report, request)))
		const prepared = selected.map((destination) => build(destination, report, scoped, 'event', destination.keys))
		const lines = prepared.map((cmcd) => encodePreparedCmcd(cmcd))

		commit(selected, prepared, scoped)

		selected.forEach((destination, i) => {
			destination.queue.push(lines[i])

			if (destination.queue.length >= (destination.target.batchSize || 1)) {
				send(destination)
			}
		})
	}

	const session: CmcdSession = {
		sid,

		createRequestReport(request, data = {}) {
			const scoped = scope(data)
			const cmcd = build(requestDestination, data, scoped, 'request', settings.enabledKeys, request.url)
			const report = { ...request, headers: { ...request.headers }, customData: { ...request.customData, cmcd } }

			if (settings.transmissionMode === 'headers') {
				Object.assign(report.headers, toPreparedCmcdHeaders(cmcd, settings.customHeaderMap))
			}
			else {
				const base = withoutCmcdParam(request.url)
				const encoded = encodePreparedCmcd(cmcd)
				report.url = encoded ? base.replace(/(#|$)/, `${base.includes('?') ? '&' : '?'}${new URLSearchParams({ CMCD: encoded })}$1`) : base
			}

			commit([requestDestination], [cmcd], scoped)

			return report as typeof request & CmcdRequestReport<(typeof request)['customData']>
		},

		recordEvent(type, data = {}, request) {
			emit(type, data, request)
		},

		recordResponseReceived(response, data = {}) {
			const { request } = response
			const url = data.url ?? request?.url

			if (!url) {
				return
			}

			// The request report already gave its msd, bs, bsd, and ec values to every destination.
			const requestData: Cmcd = { ...request?.customData?.cmcd }

			for (const key of SCOPED_KEYS) {
				delete requestData[key]
			}

			const derived: Cmcd = { url: withoutCmcdParam(url), rc: response.status }
			const { startTime, responseStart = 0, duration = 0 }: Partial<ResourceTiming> = response.resourceTiming ?? {}

			if (typeof startTime === 'number') {
				derived.ts = Math.round(timeOrigin + startTime)

				if (responseStart > 0 && responseStart >= startTime) {
					derived.ttfb = Math.round(responseStart - startTime)
				}
			}

			if (duration > 0) {
				derived.ttlb = Math.round(duration)
			}

			emit('rr', { ...requestData, ...derived, ...data }, request)
		},

		recordError(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			emit('e', { ...data, ec }, undefined, eventDestinations, { ec })
		},

		configure(next) {
			Object.assign(settings, next)
		},

		start(immediate = true) {
			const { snapshot } = config
			stopped = false

			for (const destination of eventDestinations) {
				clearInterval(destination.timer)
				const interval = destination.target.interval ?? CMCD_DEFAULT_TIME_INTERVAL

				if (snapshot && interval > 0 && !destination.gone && destination.target.events.includes('t')) {
					const tick = () => emit('t', snapshot(), undefined, [destination])

					destination.timer = setInterval(tick, interval * 1000)

					if (immediate) {
						tick()
					}
				}
			}
		},

		stop() {
			stopped = true

			for (const destination of eventDestinations) {
				clearInterval(destination.timer)
				clearTimeout(destination.retry)
				destination.retry = undefined
			}
		},

		flush() {
			eventDestinations.forEach((destination) => send(destination, true))
		},
	}

	return session
}
```
