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
 * The reporter re-stamps `sid` and assigns `sn` and `msd` after this
 * function returns, so values written to those keys are overwritten.
 *
 * Must not throw. Exceptions propagate to the `createRequestReport()`
 * caller.
 *
 * @typeParam C - The shape of the player's `customData` on the request.
 *                Defaults to `Record<string, unknown>`, whose values are
 *                `unknown` and read with bracket access.
 *
 * @public
 */
export type CmcdRequestReportTransform<C = Record<string, unknown>> = (data: Cmcd, request: CmcdTransformRequest<C>) => Cmcd | null;
