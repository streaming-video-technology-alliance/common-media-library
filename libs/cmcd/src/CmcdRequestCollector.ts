import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { CmcdCollectedRequest } from './CmcdCollectedRequest.ts'
import type { CmcdCollectedRequestMode } from './CmcdCollectedRequestMode.ts'
import { createFetchTransport } from './createFetchTransport.ts'
import { createXhrTransport } from './createXhrTransport.ts'
import type { CmcdRequestCollectorOptions } from './CmcdRequestCollectorOptions.ts'
import { CmcdRequestType } from './CmcdRequestType.ts'

const MANIFEST_EXTENSIONS = /\.(m3u8|mpd)(\?|$|\/)/i
const SEGMENT_EXTENSIONS = /\.(m4s|m4v|m4a|mp4|ts|aac)(\?|$|\/)/i

function classifyUrl(url: string, method: string): CmcdRequestType {
	if (method === 'POST') {
		return CmcdRequestType.EVENT
	}
	if (MANIFEST_EXTENSIONS.test(url)) {
		return CmcdRequestType.MANIFEST
	}
	if (SEGMENT_EXTENSIONS.test(url)) {
		return CmcdRequestType.SEGMENT
	}
	return CmcdRequestType.UNKNOWN
}

function hasCmcdHeader(headers: Record<string, string> | undefined): boolean {
	if (!headers) {
		return false
	}
	for (const name in headers) {
		if (name.toLowerCase().startsWith('cmcd-')) {
			return true
		}
	}
	return false
}

function detectReportingMode(
	url: string,
	headers: Record<string, string> | undefined,
	isEventTarget: boolean,
): CmcdCollectedRequestMode | null {
	if (isEventTarget) {
		return 'event'
	}
	if (hasCmcdHeader(headers)) {
		return 'header'
	}
	return url.includes(`${CMCD_PARAM}=`) ? 'query' : null
}

type CmcdRequestWaiter = {
	type: CmcdRequestType | undefined
	count: number
	resolve: (r: CmcdCollectedRequest[]) => void
	reject: (e: Error) => void
	timer: ReturnType<typeof setTimeout>
}

type CmcdRequestCollectorEntry = {
	type: CmcdRequestType | undefined
	resolve: (r: CmcdCollectedRequest[]) => void
	timer: ReturnType<typeof setTimeout>
}

/**
 * Test helper that captures CMCD-bearing requests across XHR and fetch
 * transports for assertion in e2e tests. Each captured request is
 * normalized to {@link @svta/cml-utils!HttpRequest | HttpRequest} so
 * tests are identical regardless of which transport the player uses.
 *
 * @example
 * {@includeCode ../test/CmcdRequestCollector.test.ts#example}
 *
 * @public
 */
export class CmcdRequestCollector {
	#requests: CmcdCollectedRequest[] = []
	#detachers: (() => void)[] = []
	#attached = false
	#eventTargetUrls: readonly string[] = []
	#waiters: CmcdRequestWaiter[] = []
	#collectors: CmcdRequestCollectorEntry[] = []

	readonly #deliver = (request: HttpRequest): Response | undefined => {
		const url = request.url
		const method = (request.method ?? 'GET').toUpperCase()
		const isEventTarget = method === 'POST' && this.#eventTargetUrls.some((t) => url.startsWith(t))

		const reportingMode = detectReportingMode(url, request.headers, isEventTarget)
		if (reportingMode === null) {
			return undefined
		}

		this.#requests.push({
			request,
			type: classifyUrl(url, method),
			reportingMode,
			timestamp: Date.now(),
		})

		this.#notifyWaiters()

		return isEventTarget ? new Response(null, { status: 204 }) : undefined
	}

	#notifyWaiters(): void {
		const remaining: CmcdRequestWaiter[] = []
		for (const waiter of this.#waiters) {
			const matching = this.getRequests(waiter.type)
			if (matching.length >= waiter.count) {
				clearTimeout(waiter.timer)
				waiter.resolve(matching)
			} else {
				remaining.push(waiter)
			}
		}
		this.#waiters = remaining
	}

	/**
	 * Install transport patches and begin collecting CMCD requests.
	 * No-op if already attached.
	 *
	 * @public
	 */
	attach(options: CmcdRequestCollectorOptions = {}): void {
		if (this.#attached) {
			return
		}
		this.#attached = true
		this.#eventTargetUrls = options.eventTargetUrls ?? []

		const transports = options.transports ?? [createXhrTransport(), createFetchTransport()]
		for (const transport of transports) {
			this.#detachers.push(transport.attach(this.#deliver))
		}
	}

	/**
	 * Remove transport patches and stop collecting. Rejects any pending
	 * `waitForRequests` promises with `Error('Collector detached while waiting')`
	 * and resolves any pending `collectFor` promises with whatever was
	 * collected up to that point.
	 *
	 * @public
	 */
	detach(): void {
		if (!this.#attached) {
			return
		}
		for (const detacher of this.#detachers) {
			detacher()
		}
		this.#detachers = []
		this.#attached = false
		this.#eventTargetUrls = []

		for (const waiter of this.#waiters) {
			clearTimeout(waiter.timer)
			waiter.reject(new Error('Collector detached while waiting'))
		}
		this.#waiters = []

		for (const entry of this.#collectors) {
			clearTimeout(entry.timer)
			entry.resolve(this.getRequests(entry.type))
		}
		this.#collectors = []
	}

	/**
	 * Discard all captured requests. Does not affect the attached state.
	 *
	 * @public
	 */
	clear(): void {
		this.#requests = []
	}

	/**
	 * Return a defensive copy of the captured requests, optionally
	 * filtered by classification.
	 *
	 * @param type - When provided, only requests with a matching
	 *   {@link CmcdRequestType} are included in the result.
	 *
	 * @public
	 */
	getRequests(type?: CmcdRequestType): CmcdCollectedRequest[] {
		if (type === undefined) {
			return [...this.#requests]
		}
		return this.#requests.filter((r) => r.type === type)
	}

	/**
	 * Wait until at least `count` requests of the given type are captured.
	 * Resolves with all matching captures; rejects with a diagnostic error
	 * on timeout (default 15000 ms). Use for positive assertions
	 * ("expect N to happen").
	 *
	 * @public
	 */
	waitForRequests(
		type: CmcdRequestType | undefined,
		count: number,
		timeout = 15000,
	): Promise<CmcdCollectedRequest[]> {
		const matching = this.getRequests(type)
		if (matching.length >= count) {
			return Promise.resolve(matching)
		}

		return new Promise<CmcdCollectedRequest[]>((resolve, reject) => {
			const timer = setTimeout(() => {
				const idx = this.#waiters.findIndex((w) => w.timer === timer)
				if (idx >= 0) {
					this.#waiters.splice(idx, 1)
				}
				const current = this.getRequests(type)
				reject(new Error(
					`Timeout waiting for ${count} ${type ?? 'any'} CMCD request(s). Got ${current.length}. Total collected: ${this.#requests.length}.`,
				))
			}, timeout)

			this.#waiters.push({ type, count, resolve, reject, timer })
		})
	}

	/**
	 * Wait for the given duration, then resolve with all captures of the
	 * given type collected so far. Never rejects on timeout (use this for
	 * negative or upper-bound assertions: "no events should fire",
	 * "exactly N segments and no more").
	 *
	 * @public
	 */
	collectFor(
		timeout: number,
		type?: CmcdRequestType,
	): Promise<CmcdCollectedRequest[]> {
		return new Promise<CmcdCollectedRequest[]>((resolve) => {
			const timer = setTimeout(() => {
				const idx = this.#collectors.findIndex((c) => c.timer === timer)
				if (idx >= 0) {
					this.#collectors.splice(idx, 1)
				}
				resolve(this.getRequests(type))
			}, timeout)
			this.#collectors.push({ type, resolve, timer })
		})
	}
}
