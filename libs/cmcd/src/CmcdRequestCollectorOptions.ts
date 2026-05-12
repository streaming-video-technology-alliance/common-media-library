import type { CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

/**
 * Options for `CmcdRequestCollector.attach()`.
 *
 * @public
 */
export type CmcdRequestCollectorOptions = {

	/**
	 * URLs whose POST requests are intercepted and stubbed with a
	 * synthetic 204 response, instead of being passed through to the
	 * network. A request matches if its URL starts with any entry.
	 *
	 * Use this to verify CMCD event-mode reports without making real
	 * network calls to placeholder endpoints.
	 */
	eventTargetUrls?: readonly string[];

	/**
	 * Override the default set of transport adapters. Defaults to
	 * `[createXhrTransport(), createFetchTransport()]`, which patches
	 * `XMLHttpRequest` and `fetch` on the current realm.
	 *
	 * Supply this when the player under test uses a non-standard
	 * transport (e.g. a custom HTTP client).
	 */
	transports?: readonly CmcdTransportAdapter[];
}
