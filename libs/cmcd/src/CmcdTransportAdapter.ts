import type { HttpRequest } from '@svta/cml-utils'

/**
 * Callback the collector supplies to a transport adapter. The adapter
 * calls this once per intercepted request, with the request normalized
 * to {@link @svta/cml-utils!HttpRequest | HttpRequest}.
 *
 * If the callback returns a `Response`, the adapter must short-circuit
 * the underlying transport and complete the request with that response
 * (used for event-target POST stubbing).
 *
 * If the callback returns `undefined`, the adapter forwards the request
 * to the original transport unchanged.
 *
 * @public
 */
export type CmcdRequestDeliver = (request: HttpRequest) => Response | undefined

/**
 * Pluggable transport-interception contract for `CmcdRequestCollector`.
 * The default implementations (`createXhrTransport`, `createFetchTransport`)
 * patch global `XMLHttpRequest` and `fetch`. Custom adapters can wrap
 * other transports (e.g. `undici`, a player-internal HTTP client).
 *
 * @public
 */
export type CmcdTransportAdapter = {

	/**
	 * Install the transport's interception hook. Called once per
	 * collector `attach()`. The adapter must normalize each outgoing
	 * request to `HttpRequest` (reading the body to a synchronous value
	 * if necessary) and invoke `deliver`. Returns a detach function that
	 * restores the original transport.
	 */
	attach(deliver: CmcdRequestDeliver): () => void;
}
