import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdRequest } from './CmcdRequest.ts'
import type { CmcdRequestReport } from './CmcdRequestReport.ts'
import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'

/**
 * A CMCD session. One session reports one `sid`.
 *
 * The session keeps only the state that CTA-5004-B scopes to a session or to a destination.
 * The player passes its CMCD data with each call.
 * The data types leave out the keys that the session writes: `sid`, `sn`, `e`, and `v`.
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
	 * Replaces the request mode settings: `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap`.
	 * The `sid` and every sequence number stay.
	 *
	 * @param settings - The new settings.
	 */
	configure(settings: CmcdSessionRequestReportConfig): void
}
