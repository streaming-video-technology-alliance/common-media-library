import type { CmcdCollectedRequest } from './CmcdCollectedRequest.ts'
import type { CmcdRequestCollectorOptions } from './CmcdRequestCollectorOptions.ts'
import { CmcdRequestType } from './CmcdRequestType.ts'

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

		const transports = options.transports ?? []
		const deliver = (request: import('@svta/cml-utils').HttpRequest): Response | undefined => {
			this.#requests.push({
				request,
				type: CmcdRequestType.UNKNOWN,
				reportingMode: 'query',
				timestamp: Date.now(),
			})
			return undefined
		}

		for (const transport of transports) {
			this.#detachers.push(transport.attach(deliver))
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
