import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'

/**
 * Transforms a request-mode CMCD report before it is applied to the
 * outgoing request.
 *
 * Return the data to continue, or `null` to skip CMCD decoration for
 * this request entirely. The `data` argument is a per-report copy, so
 * mutating it in place never affects the reporter's persistent data.
 * The `request` argument is the request passed to
 * `createRequestReport()`; mutating it has no effect on the returned
 * report.
 *
 * The reporter assigns `sn` and `msd` after this function returns, so
 * values written to those keys are overwritten.
 *
 * Must not throw. Exceptions propagate to the `createRequestReport()`
 * caller.
 *
 * @public
 */
export type CmcdRequestReportTransform = (data: Cmcd, request: HttpRequest) => Cmcd | null;
