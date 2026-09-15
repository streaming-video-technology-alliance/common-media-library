import type { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventReportTransform } from './CmcdEventReportTransform.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'

/**
 * Configuration for a CMCD event report.
 *
 * @typeParam C - The type of the player's `customData` on the request that
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
	 * The URL where the reporter sends CMCD event reports.
	 */
	url: string;

	/**
	 * The events to report. If the caller provides no events,
	 * the event target is effectively disabled.
	 *
	 * @defaultValue `undefined`
	 */
	events?: CmcdEventType[];

	/**
	 * When the time interval event is sent, the interval in seconds at
	 * which the reporter sends it.
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
	 * The transform is scoped to this target only. Targets that share a
	 * collector URL each run their own transform. Other targets that
	 * accept the event still receive a report cancelled by this transform.
	 *
	 * @defaultValue `undefined`
	 *
	 * @example
	 * {@includeCode ../test/CmcdReporter.test.ts#example-transform}
	 */
	transform?: CmcdEventReportTransform<C>;
};
