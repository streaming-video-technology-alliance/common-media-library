import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdRecordedReportMode } from './CmcdRecordedReportMode.ts'
import type { CmcdRecordedRequestType } from './CmcdRecordedRequestType.ts'

/**
 * A CMCD report captured by `CmcdReportRecorder`, normalized to
 * `HttpRequest` regardless of the transport that produced it.
 *
 * @public
 */
export type CmcdRecordedReport = {

	/**
	 * The captured request that carried the CMCD report, normalized to
	 * {@link @svta/cml-utils!HttpRequest | HttpRequest}. Headers are
	 * lowercase-keyed; bodies are eagerly read as strings.
	 */
	readonly request: HttpRequest;

	/**
	 * Classification of the underlying request (manifest / segment / event / unknown).
	 */
	readonly type: CmcdRecordedRequestType;

	/**
	 * Reporting mode under which the CMCD data was carried:
	 * `'query'` for `CMCD=` URL parameter, `'header'` for `Cmcd-*`
	 * HTTP headers, `'event'` for an event-target POST body.
	 */
	readonly reportingMode: CmcdRecordedReportMode;

	/**
	 * Wall-clock millisecond timestamp from `Date.now()` at capture time.
	 */
	readonly timestamp: number;
}
