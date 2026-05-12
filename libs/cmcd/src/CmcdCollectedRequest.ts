import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdCollectedRequestMode } from './CmcdCollectedRequestMode.ts'
import type { CmcdRequestType } from './CmcdRequestType.ts'

/**
 * A request captured by `CmcdRequestCollector`, normalized to
 * `HttpRequest` regardless of the transport that produced it.
 *
 * @public
 */
export type CmcdCollectedRequest = {

	/**
	 * The captured request, normalized to {@link @svta/cml-utils!HttpRequest | HttpRequest}.
	 * Headers are lowercase-keyed; bodies are eagerly read as strings.
	 */
	readonly request: HttpRequest;

	/**
	 * Classification of the request (manifest / segment / event / unknown).
	 */
	readonly type: CmcdRequestType;

	/**
	 * Reporting mode under which the CMCD data was carried:
	 * `'query'` for `CMCD=` URL parameter, `'header'` for `Cmcd-*`
	 * HTTP headers, `'event'` for an event-target POST body.
	 */
	readonly reportingMode: CmcdCollectedRequestMode;

	/**
	 * Wall-clock millisecond timestamp from `Date.now()` at capture time.
	 */
	readonly timestamp: number;
}
