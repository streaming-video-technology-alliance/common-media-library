import type { Cmcd } from './Cmcd.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'

/**
 * Transforms an event-mode CMCD report before the reporter queues it for
 * its target.
 *
 * Return the data to continue, or `null` to cancel the report. The
 * `data` argument is a per-target copy, so mutating it affects neither
 * the reporter's persistent data nor the reports for other targets.
 *
 * The `request` argument is the media request that triggered the event
 * (for events recorded through
 * {@link CmcdReporter.recordResponseReceived}), otherwise `undefined`.
 * The request is a read-only view for context only. A transform must
 * not mutate it. See {@link CmcdTransformRequest}.
 *
 * The reporter rewrites `e` and `sid` and assigns `sn` and `msd` after this
 * function returns, so values written to those keys are overwritten.
 *
 * Must not throw. Exceptions propagate to the caller that recorded the
 * event. For time-interval events, that caller is the interval timer.
 *
 * @typeParam C - The type of the player's `customData` on the request.
 *                Defaults to `Record<string, unknown>`, whose values are
 *                `unknown` and read with bracket access.
 *
 * @deprecated This type serves `transform` of `CmcdReporter`. A session has no transform. A {@link CmcdReportFilter} drops reports, and the data of each call changes them.
 * The {@link https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/cmcd/docs/migration-guide.md | migration guide} maps each member to the session API. Version 3.0.0 removes this type.
 *
 * @public
 */
export type CmcdEventReportTransform<C = Record<string, unknown>> = (
	data: Cmcd,
	request: CmcdTransformRequest<C> | undefined,
) => Cmcd | null
