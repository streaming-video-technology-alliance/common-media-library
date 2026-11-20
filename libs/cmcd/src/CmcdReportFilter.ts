import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'

/**
 * Selects the reports that an event target of a CMCD session receives.
 *
 * The session calls the filter before it builds the report.
 * A report that the filter rejects uses no sequence number.
 * The filter must not change its arguments.
 * If the filter throws, no target receives the report, and the error goes to the caller.
 *
 * @param report - The data of the report, with `e` and `ts` set.
 * @param request - The request of an `rr` report, or the request that the player passed to `recordEvent()`.
 * @returns `true` if the target receives the report.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/createCmcdSession.events.test.ts#example}
 */
export type CmcdReportFilter = (
	report: DeepReadonly<Cmcd>,
	request?: DeepReadonly<HttpRequest>,
) => boolean
