import type { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventReportTransform } from './CmcdEventReportTransform.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'

/**
 * Configuration for a CMCD event report.
 *
 * @typeParam C - The shape of the player's `customData` on the request that
 *                triggered the event. Defaults to `Record<string, unknown>`.
 *
 * @public
 */
export type CmcdEventReportConfig<C = Record<string, unknown>> = CmcdReportConfig & {
	/**
	 * The version of the CMCD protocol to use. Must be
	 * version 2 or higher for event reporting.
	 *
	 * @defaultValue `CMCD_V2`
	 */
	version?: typeof CMCD_V2

	/**
	 * The URL to which the CMCD event should be sent.
	 */
	url: string;

	/**
	 * The events to report. If no events are provided,
	 * the event target will be effectively disabled.
	 *
	 * @defaultValue `undefined`
	 */
	events?: CmcdEventType[];

	/**
	 * When the time interval event is sent, the interval at which the
	 * events should be reported as a number of seconds.
	 *
	 * @defaultValue `CMCD_DEFAULT_TIME_INTERVAL`
	 *
	 * @see {@link CMCD_DEFAULT_TIME_INTERVAL}
	 */
	interval?: number;

	/**
	 * The number of events to batch before sending the report.
	 *
	 * @defaultValue `1`
	 */
	batchSize?: number;

	/**
	 * Transform applied to each of this target's event reports before
	 * it is queued. Return the data to continue, or `null` to cancel
	 * the report for this target.
	 *
	 * Scoped to this target only: targets that share a collector URL
	 * each run their own transform, and a report cancelled here is
	 * still sent to other targets that accept the event.
	 *
	 * @defaultValue `undefined`
	 *
	 * @example
	 * {@includeCode ../test/CmcdReporter.test.ts#example-transform}
	 */
	transform?: CmcdEventReportTransform<C>;
};
