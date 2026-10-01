# Prototype: first client

Reference code for [analysis.md](../analysis.md). It is not production code. The `#cmcd/` imports point to `libs/cmcd/src`. The repository typecheck covers every `.ts` file, so this folder keeps the code as a listing.

## createCmcdClient.ts

```ts
/**
 * Prototype, full variant: the core client plus the state CTA-5004-B scopes to a
 * destination or a session, and nothing derived from playback.
 *
 * - `once(data)`: keys every destination receives once, on its next report.
 *   Covers `msd` (once per mode), `bs` (per destination since the last report),
 *   `bsd` (once per mode and destination), and buffered `ec`. Lists append, scalars replace.
 * - `error(codes)`: `e=e` now to the targets that list `e`, buffered `ec` for the others.
 * - `configure(settings)`: changes version, mode, and keys without a new sid or sn.
 * - `snapshot` + per-target `interval`: `t` reports read the player's state at each tick.
 * - `dispose()`: flushes and stops the timers.
 */
import { uuid } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from '#cmcd/CMCD_MIME_TYPE.ts'
import type { Cmcd } from '#cmcd/Cmcd.ts'
import type { CmcdEventType } from '#cmcd/CmcdEventType.ts'
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
}

export type CmcdClientRequest = { url: string; headers?: Record<string, string> }

export type CmcdClientSettings = {
	version?: 1 | 2
	transmissionMode?: 'query' | 'headers'
	keys?: readonly CmcdKey[]
}

export type CmcdClientConfig = CmcdClientSettings & {
	sid?: string
	cid?: string
	targets?: readonly CmcdClientTarget[]
	snapshot?: () => Cmcd
	send?: (request: { url: string; method: string; headers: Record<string, string>; body: string }) => Promise<{ status: number }>
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
	event(type: CmcdEventType, data?: Cmcd): void
	error(codes: string | readonly string[], data?: Cmcd): void
	once(data: Cmcd): void
	configure(settings: CmcdClientSettings): void
	flush(): void
	dispose(): void
}

function merge(pending: Record<string, unknown>, data: Record<string, unknown>): void {
	for (const key in data) {
		const value = data[key]
		const prior = pending[key]
		pending[key] = Array.isArray(prior) && Array.isArray(value) ? [...prior, ...value] : value
	}
}

export function createCmcdClient(config: CmcdClientConfig = {}): CmcdClient {
	const sid = config.sid || uuid()
	const settings: CmcdClientSettings = { version: config.version || 1, transmissionMode: config.transmissionMode, keys: config.keys }
	const send = config.send || ((r) => fetch(r.url, { method: r.method, headers: r.headers, body: r.body, keepalive: true }))
	const requestDestination: Destination = { sn: 0, pending: {} }
	const eventDestinations: EventDestination[] = (config.targets || []).map((target) => ({ target, sn: 0, pending: {}, keys: target.keys, queue: [], gone: false }))
	const all: Destination[] = [requestDestination, ...eventDestinations]

	function prepare(destination: Destination, data: Cmcd, reportingMode: 'request' | 'event', keys?: readonly CmcdKey[], baseUrl?: string): Cmcd {
		const report: Cmcd = { cid: config.cid, ...data, ...destination.pending, sid, sn: destination.sn }
		const prepared = prepareCmcdData(report, {
			version: reportingMode === 'event' ? 2 : settings.version,
			reportingMode,
			filter: keys && ((key) => keys.includes(key)),
			baseUrl,
		})

		destination.sn++
		destination.pending = {}

		return prepared
	}

	function flushDestination(destination: EventDestination): void {
		if (destination.gone || !destination.queue.length) {
			return
		}

		const lines = destination.queue.splice(0)
		const retry = () => destination.queue.unshift(...lines)

		send({ url: destination.target.url, method: 'POST', headers: { 'Content-Type': CMCD_MIME_TYPE }, body: lines.join('\n') }).then(({ status }) => {
			if (status === 410) {
				destination.gone = true
				destination.queue.length = 0
				clearInterval(destination.timer)
			}
			else if (status === 429 || status > 499) {
				retry()
			}
		}, retry)
	}

	function emit(destination: EventDestination, type: CmcdEventType, data: Cmcd): void {
		if (destination.gone || !destination.target.events.includes(type)) {
			return
		}

		destination.queue.push(encodePreparedCmcd(prepare(destination, { ...data, e: type, ts: data.ts ?? Date.now() }, 'event', destination.keys)))

		if (destination.queue.length >= (destination.target.batchSize || 1)) {
			flushDestination(destination)
		}
	}

	const { snapshot } = config

	if (snapshot) {
		for (const destination of eventDestinations) {
			const interval = destination.target.interval ?? 30

			if (interval > 0) {
				destination.timer = setInterval(() => emit(destination, 't', snapshot()), interval * 1000)
			}
		}
	}

	const client: CmcdClient = {
		sid,

		request(request, data = {}) {
			const cmcd = prepare(requestDestination, data, 'request', settings.keys, request.url)

			if (settings.transmissionMode === 'headers') {
				return { url: request.url, headers: { ...request.headers, ...toPreparedCmcdHeaders(cmcd) }, cmcd }
			}

			const encoded = encodePreparedCmcd(cmcd)
			const url = encoded ? `${request.url}${request.url.includes('?') ? '&' : '?'}CMCD=${encodeURIComponent(encoded)}` : request.url

			return { url, headers: request.headers, cmcd }
		},

		event(type, data = {}) {
			for (const destination of eventDestinations) {
				emit(destination, type, data)
			}
		},

		error(codes, data = {}) {
			const ec = typeof codes === 'string' ? [codes] : [...codes]

			for (const destination of all) {
				if ('target' in destination && (destination as EventDestination).target.events.includes('e')) {
					emit(destination as EventDestination, 'e', { ...data, ec })
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

		flush() {
			eventDestinations.forEach(flushDestination)
		},

		dispose() {
			client.flush()
			eventDestinations.forEach((destination) => clearInterval(destination.timer))
		},
	}

	return client
}
```

## toCmcdResponseData.ts

```ts
/**
 * Prototype: the response keys of an `rr` report, from a URL, a status, and
 * a resource timing entry. The player passes the result to `client.event('rr', ...)`.
 */
import type { Cmcd } from '#cmcd/Cmcd.ts'

export type CmcdResponseTiming = { startTime?: number; responseStart?: number; duration?: number }

export function toCmcdResponseData(url: string, status: number, timing?: CmcdResponseTiming, timeOrigin: number = performance.timeOrigin): Cmcd {
	const data: Cmcd = { url: url.replace(/([?&])CMCD=[^&]*&?/, '$1').replace(/[?&]$/, ''), rc: status }

	if (timing?.startTime != null) {
		data.ts = Math.round(timeOrigin + timing.startTime)

		if (timing.responseStart != null) {
			data.ttfb = Math.round(timing.responseStart - timing.startTime)
		}
	}

	if (timing?.duration != null) {
		data.ttlb = Math.round(timing.duration)
	}

	return data
}
```
