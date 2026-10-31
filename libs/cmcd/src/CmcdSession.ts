import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEvent } from './CmcdEvent.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequest } from './CmcdRequest.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 * The data types leave out the keys that the session writes: `sid`, `sn`, `e`, and `v`.
 * `ec` goes only through `recordError()`.
 *
 * @public
 */
export type CmcdSession = {
	/**
	 * The session ID of every report.
	 */
	readonly sid: string

	/**
	 * Returns a copy of the request with a CMCD request report.
	 *
	 * In query mode, the first `CMCD` parameter of the URL takes the new value in place.
	 * The session removes the other `CMCD` parameters.
	 * In header mode, the session replaces the CMCD headers.
	 * `customData.cmcd` holds the report data before encoding.
	 * Each call advances the sequence number of request mode.
	 *
	 * @param request - The request to report.
	 * @param data - The CMCD data of the request.
	 * @returns A copy of the request with the report.
	 *
	 * @throws If a value cannot be encoded. The call then changes no state.
	 */
	createRequestReport<R extends HttpRequest>(
		request: R,
		data?: Omit<CmcdRequest, 'sid' | 'sn' | 'v' | 'ec'>,
	): R & CmcdRequestReport<R['customData']>

	/**
	 * Records an event report for each selected event target.
	 *
	 * A target is selected when it lists the event type and its `filter` returns `true`.
	 *
	 * @param type - The event type.
	 * @param data - The CMCD data of the event.
	 * @param request - A request for the filters.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
	 */
	recordEvent(
		type: CmcdEventType,
		data?: Omit<Cmcd, 'sid' | 'sn' | 'e' | 'v' | 'ec'>,
		request?: Readonly<HttpRequest>,
	): void

	/**
	 * Records an error.
	 *
	 * Each selected target that lists `e` receives an `e` report with `ec`.
	 * Every other destination sends the codes with its next report.
	 *
	 * @param codes - The error codes.
	 * @param data - The CMCD data of the error report.
	 *
	 * @throws If a filter throws, or if a value cannot be encoded. The call then changes no state.
	 *
	 * @example
	 * {@includeCode ../test/createCmcdSession.errors.test.ts#example}
	 */
	recordError(
		codes: string | readonly string[],
		data?: Omit<CmcdEvent, 'sid' | 'sn' | 'e' | 'v' | 'ec'>,
	): void

	/**
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdSessionRequestReportConfig): void

	/**
	 * Sends the queue of each event target at once.
	 * If a POST is in flight, the target sends after its response.
	 */
	flush(): void
}
