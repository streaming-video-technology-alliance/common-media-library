import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { CmcdRecordedReport } from './CmcdRecordedReport.ts'
import type { CmcdRecordedReportMode } from './CmcdRecordedReportMode.ts'
import type { CmcdReportRecorderOptions } from './CmcdReportRecorderOptions.ts'
import type { CmcdReportRecorderWaitOptions } from './CmcdReportRecorderWaitOptions.ts'
import { CmcdRecorderRequestType } from './CmcdRecorderRequestType.ts'
import { createFetchTransport } from './createFetchTransport.ts'
import { createXhrTransport } from './createXhrTransport.ts'

const MANIFEST_EXTENSIONS = /\.(m3u8|mpd)(\?|$|\/)/i
const SEGMENT_EXTENSIONS = /\.(m4s|m4v|m4a|mp4|ts|aac)(\?|$|\/)/i

function classifyUrl(url: string, method: string): CmcdRecorderRequestType {
	if (method === 'POST') {
		return CmcdRecorderRequestType.EVENT
	}
	if (MANIFEST_EXTENSIONS.test(url)) {
		return CmcdRecorderRequestType.MANIFEST
	}
	if (SEGMENT_EXTENSIONS.test(url)) {
		return CmcdRecorderRequestType.SEGMENT
	}
	return CmcdRecorderRequestType.UNKNOWN
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
	type: CmcdRecorderRequestType | undefined
	count: number
	resolve: (r: CmcdRecordedReport[]) => void
	reject: (e: Error) => void
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
	#waiters = new Map<ReturnType<typeof setTimeout>, CmcdReportWaiter>()
	#onReport: ((report: CmcdRecordedReport) => void) | undefined
	#waitTimeout = 15000

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

	#getMatching(type: CmcdRecorderRequestType | undefined): CmcdRecordedReport[] {
		return type === undefined
			? [...this.#reports]
			: this.#reports.filter((r) => r.type === type)
	}

	#notifyWaiters(): void {
		for (const [timer, waiter] of this.#waiters) {
			const matching = this.#getMatching(waiter.type)
			if (matching.length >= waiter.count) {
				clearTimeout(timer)
				this.#waiters.delete(timer)
				waiter.resolve(matching)
			}
		}
	}

	#waitFor(
		type: CmcdRecorderRequestType | undefined,
		options: CmcdReportRecorderWaitOptions,
	): Promise<CmcdRecordedReport[]> {
		const count = options.count ?? 1
		const timeout = options.timeout ?? this.#waitTimeout

		const matching = this.#getMatching(type)
		if (matching.length >= count) {
			return Promise.resolve(matching)
		}

		return new Promise<CmcdRecordedReport[]>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#waiters.delete(timer)
				const current = this.#getMatching(type)
				reject(new Error(
					`Timeout waiting for ${count} ${type ?? 'any'} CMCD report(s). Got ${current.length}. Total recorded: ${this.#reports.length}.`,
				))
			}, timeout)

			this.#waiters.set(timer, { type, count, resolve, reject })
		})
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
		this.#waitTimeout = options.waitTimeout ?? 15000

		const transports = options.transports ?? [createXhrTransport(), createFetchTransport()]
		for (const transport of transports) {
			this.#detachers.push(transport.attach(this.#deliver))
		}
	}

	/**
	 * Remove transport patches and stop recording. Rejects any pending
	 * wait promises with `Error('Recorder detached while waiting')`.
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
	 * Return a defensive copy of all recorded reports.
	 *
	 * @public
	 */
	getReports(): CmcdRecordedReport[] {
		return [...this.#reports]
	}

	/**
	 * Wait until at least `count` reports of any type are recorded.
	 * Resolves with all matching reports; rejects with a diagnostic error
	 * on timeout. `count` defaults to 1; `timeout` falls back to the
	 * recorder's `waitTimeout` option (default 15000 ms).
	 *
	 * @public
	 */
	waitForReports(options: CmcdReportRecorderWaitOptions = {}): Promise<CmcdRecordedReport[]> {
		return this.#waitFor(undefined, options)
	}

	/**
	 * Wait until at least `count` manifest reports are recorded.
	 * Resolves with all matching reports; rejects with a diagnostic error
	 * on timeout. `count` defaults to 1; `timeout` falls back to the
	 * recorder's `waitTimeout` option (default 15000 ms).
	 *
	 * @public
	 */
	waitForManifest(options: CmcdReportRecorderWaitOptions = {}): Promise<CmcdRecordedReport[]> {
		return this.#waitFor(CmcdRecorderRequestType.MANIFEST, options)
	}

	/**
	 * Wait until at least `count` segment reports are recorded.
	 * Resolves with all matching reports; rejects with a diagnostic error
	 * on timeout. `count` defaults to 1; `timeout` falls back to the
	 * recorder's `waitTimeout` option (default 15000 ms).
	 *
	 * @public
	 */
	waitForSegments(options: CmcdReportRecorderWaitOptions = {}): Promise<CmcdRecordedReport[]> {
		return this.#waitFor(CmcdRecorderRequestType.SEGMENT, options)
	}

	/**
	 * Wait until at least `count` event-mode reports are recorded.
	 * Resolves with all matching reports; rejects with a diagnostic error
	 * on timeout. `count` defaults to 1; `timeout` falls back to the
	 * recorder's `waitTimeout` option (default 15000 ms).
	 *
	 * @public
	 */
	waitForEvents(options: CmcdReportRecorderWaitOptions = {}): Promise<CmcdRecordedReport[]> {
		return this.#waitFor(CmcdRecorderRequestType.EVENT, options)
	}
}
