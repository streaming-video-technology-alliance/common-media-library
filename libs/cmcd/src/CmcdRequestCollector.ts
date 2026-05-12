import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { CmcdCollectedRequest } from './CmcdCollectedRequest.ts'
import type { CmcdCollectedRequestMode } from './CmcdCollectedRequestMode.ts'
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

/**
 * Test helper that captures CMCD-bearing requests across XHR and fetch
 * transports for assertion in e2e tests. Each captured request is
 * normalized to {@link @svta/cml-utils!HttpRequest | HttpRequest} so
 * tests are identical regardless of which transport the player uses.
 *
 * @public
 */
export class CmcdRequestCollector {
	#requests: CmcdCollectedRequest[] = []
	#detachers: Array<() => void> = []
	#attached = false
	#eventTargetUrls: readonly string[] = []

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

		return undefined
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

		const transports = options.transports ?? []
		for (const transport of transports) {
			this.#detachers.push(transport.attach(this.#deliver))
		}
	}

	/**
	 * Remove transport patches and stop collecting.
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
	 * @public
	 */
	getRequests(type?: CmcdRequestType): CmcdCollectedRequest[] {
		if (type === undefined) {
			return [...this.#requests]
		}
		return this.#requests.filter((r) => r.type === type)
	}
}
