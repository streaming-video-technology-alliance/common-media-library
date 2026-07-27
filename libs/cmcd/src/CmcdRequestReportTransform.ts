import type { Cmcd } from './Cmcd.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'

/**
 * Transforms a request-mode CMCD report before it is applied to the
 * outgoing request.
 *
 * Return the data to continue, or `null` to skip CMCD decoration for
 * this request entirely. The `data` argument is a per-report copy, so
 * mutating it in place never affects the reporter's persistent data.
 * The `request` argument is the request passed to
 * `createRequestReport()`, as a read-only view. It is context only and
 * must not be mutated; see {@link CmcdTransformRequest}.
 *
 * The reporter assigns `sn` and `msd` after this function returns, so
 * values written to those keys are overwritten.
 *
 * Must not throw. Exceptions propagate to the `createRequestReport()`
 * caller.
 *
 * @public
 */
export type CmcdRequestReportTransform = (data: Cmcd, request: CmcdTransformRequest) => Cmcd | null;
