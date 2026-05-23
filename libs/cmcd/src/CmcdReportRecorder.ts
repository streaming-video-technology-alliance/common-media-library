import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { CmcdRecordedReport } from './CmcdRecordedReport.ts'
import type { CmcdRecordedReportMode } from './CmcdRecordedReportMode.ts'
import { createFetchTransport } from './createFetchTransport.ts'
import { createXhrTransport } from './createXhrTransport.ts'
import type { CmcdReportRecorderOptions } from './CmcdReportRecorderOptions.ts'
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
): CmcdRecordedReportMode | null {
	if (isEventTarget) {
		return 'event'
	}
	if (hasCmcdHeader(headers)) {
		return 'header'
	}
	return url.includes(`${CMCD_PARAM}=`) ? 'query' : null
}

type CmcdReportWaiter = {
	type: CmcdRequestType | undefined
	count: number
	resolve: (r: CmcdRecordedReport[]) => void
	reject: (e: Error) => void
}

type CmcdReportRecorderEntry = {
	type: CmcdRequestType | undefined
	resolve: (r: CmcdRecordedReport[]) => void
	timer: ReturnType<typeof setTimeout>
}

/**
 * Test helper that records CMCD-bearing reports across XHR and fetch
 * transports for assertion in e2e tests. Each captured request is
 * normalized to {@link @svta/cml-utils!HttpRequest | HttpRequest} so
 * tests are identical regardless of which transport the player uses.
 *
 * @example
 * {@includeCode ../test/CmcdReportRecorder.test.ts#example}
 *
 * @public
 */
export class CmcdReportRecorder {
	#reports: CmcdRecordedReport[] = []
	#detachers: (() => void)[] = []
	#attached = false
	#eventTargetUrls: readonly string[] = []
	#waiters: Map<ReturnType<typeof setTimeout>, CmcdReportWaiter> = new Map()
	#recorders: CmcdReportRecorderEntry[] = []
	#onReport: ((report: CmcdRecordedReport) => void) | undefined

	readonly #deliver = (request: HttpRequest): Response | undefined => {
		const url = request.url
		const method = (request.method ?? 'GET').toUpperCase()
		const isEventTarget = method === 'POST' && this.#eventTargetUrls.some((t) => url.startsWith(t))

		const reportingMode = detectReportingMode(url, request.headers, isEventTarget)
		if (reportingMode === null) {
			return undefined
		}

		const captured: CmcdRecordedReport = {
			request,
			type: classifyUrl(url, method),
			reportingMode,
			timestamp: Date.now(),
		}
		this.#reports.push(captured)
		if (this.#onReport) {
			try {
				this.#onReport(captured)
			} catch (err) {
				console.error('CmcdReportRecorder onReport listener threw:', err)
			}
		}
		this.#notifyWaiters()

		return isEventTarget ? new Response(null, { status: 204 }) : undefined
	}

	#notifyWaiters(): void {
		for (const [timer, waiter] of this.#waiters) {
			const matching = this.getReports(waiter.type)
			if (matching.length >= waiter.count) {
				clearTimeout(timer)
				this.#waiters.delete(timer)
				waiter.resolve(matching)
			}
		}
	}

	/**
	 * Install transport patches and begin recording CMCD reports.
	 * No-op if already attached.
	 *
	 * @public
	 */
	attach(options: CmcdReportRecorderOptions = {}): void {
		if (this.#attached) {
			return
		}
		this.#attached = true
		this.#eventTargetUrls = options.eventTargetUrls ?? []
		this.#onReport = options.onReport

		const transports = options.transports ?? [createXhrTransport(), createFetchTransport()]
		for (const transport of transports) {
			this.#detachers.push(transport.attach(this.#deliver))
		}
	}

	/**
	 * Remove transport patches and stop recording. Rejects any pending
	 * `waitForReports` promises with `Error('Recorder detached while waiting')`
	 * and resolves any pending `recordFor` promises with whatever was
	 * recorded up to that point.
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
		this.#onReport = undefined

		for (const [timer, waiter] of this.#waiters) {
			clearTimeout(timer)
			waiter.reject(new Error('Recorder detached while waiting'))
		}
		this.#waiters.clear()

		for (const entry of this.#recorders) {
			clearTimeout(entry.timer)
			entry.resolve(this.getReports(entry.type))
		}
		this.#recorders = []
	}

	/**
	 * Discard all recorded reports. Does not affect the attached state.
	 *
	 * @public
	 */
	clear(): void {
		this.#reports = []
	}

	/**
	 * Return a defensive copy of the recorded reports, optionally
	 * filtered by classification.
	 *
	 * @param type - When provided, only reports whose underlying request
	 *   matches {@link CmcdRequestType:type} are included in the result.
	 *
	 * @public
	 */
	getReports(type?: CmcdRequestType): CmcdRecordedReport[] {
		if (type === undefined) {
			return [...this.#reports]
		}
		return this.#reports.filter((r) => r.type === type)
	}

	/**
	 * Wait until at least `count` reports of the given type are recorded.
	 * Resolves with all matching reports; rejects with a diagnostic error
	 * on timeout (default 15000 ms). Use for positive assertions
	 * ("expect N to happen").
	 *
	 * @public
	 */
	waitForReports(
		type: CmcdRequestType | undefined,
		count: number,
		timeout = 15000,
	): Promise<CmcdRecordedReport[]> {
		const matching = this.getReports(type)
		if (matching.length >= count) {
			return Promise.resolve(matching)
		}

		return new Promise<CmcdRecordedReport[]>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#waiters.delete(timer)
				const current = this.getReports(type)
				reject(new Error(
					`Timeout waiting for ${count} ${type ?? 'any'} CMCD report(s). Got ${current.length}. Total recorded: ${this.#reports.length}.`,
				))
			}, timeout)

			this.#waiters.set(timer, { type, count, resolve, reject })
		})
	}

	/**
	 * Wait for the given duration, then resolve with all reports of the
	 * given type recorded so far. Never rejects on timeout (use this for
	 * negative or upper-bound assertions: "no events should fire",
	 * "exactly N segments and no more").
	 *
	 * @public
	 */
	recordFor(
		timeout: number,
		type?: CmcdRequestType,
	): Promise<CmcdRecordedReport[]> {
		return new Promise<CmcdRecordedReport[]>((resolve) => {
			const timer = setTimeout(() => {
				const idx = this.#recorders.findIndex((c) => c.timer === timer)
				if (idx >= 0) {
					this.#recorders.splice(idx, 1)
				}
				resolve(this.getReports(type))
			}, timeout)
			this.#recorders.push({ type, resolve, timer })
		})
	}
}
