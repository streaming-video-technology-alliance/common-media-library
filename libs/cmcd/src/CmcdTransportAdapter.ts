import type { HttpRequest } from '@svta/cml-utils'

/**
 * Callback the recorder supplies to a transport adapter. The adapter
 * calls it once per intercepted request, with the request normalized
 * to {@link @svta/cml-utils!HttpRequest | HttpRequest}.
 *
 * If the callback returns a `Response`, the adapter must bypass the
 * transport. It must complete the request with that response (used for
 * event-target POST stubbing).
 *
 * If the callback returns `undefined`, the adapter forwards the request
 * to the original transport unchanged.
 *
 * @public
 */
export type CmcdRequestDeliver = (request: HttpRequest) => Response | undefined

/**
 * Pluggable transport-interception contract for `CmcdReportRecorder`.
 * The default implementations, `createXhrTransport` and `createFetchTransport`,
 * patch global `XMLHttpRequest` and `fetch`. Custom adapters can wrap
 * other transports, for example `undici` or a player-internal HTTP client.
 *
 * @public
 */
export type CmcdTransportAdapter = {

	/**
	 * Install interception on the transport. Called once per
	 * recorder `attach()`. The adapter must normalize each outgoing
	 * request to `HttpRequest` (reading the body to a synchronous value
	 * if necessary) and invoke `deliver`. Returns a detach function that
	 * restores the original transport.
	 */
	attach(deliver: CmcdRequestDeliver): () => void;
}
