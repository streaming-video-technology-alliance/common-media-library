import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'

/**
 * Transforms an event-mode CMCD report before it is queued for its
 * target.
 *
 * Return the data to continue, or `null` to cancel the report. The
 * `data` argument is a per-target copy, so mutating it in place affects
 * neither the reporter's persistent data nor the reports bound for
 * other targets.
 *
 * The `request` argument is the media request that triggered the event
 * when one exists (events recorded via
 * {@link CmcdReporter.recordResponseReceived}), otherwise `undefined`.
 *
 * The reporter re-stamps `e` and assigns `sn` and `msd` after this
 * function returns, so values written to those keys are overwritten.
 *
 * Must not throw. Exceptions propagate to the caller that recorded the
 * event, which for time-interval events is the interval timer.
 *
 * @public
 */
export type CmcdEventReportTransform = (data: Cmcd, request: HttpRequest | undefined) => Cmcd | null;
