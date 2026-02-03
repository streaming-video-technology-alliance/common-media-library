import type { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'

/**
 * Configuration for a CMCD event report.
 *
 * @public
 */
export type CmcdEventReportConfig = CmcdReportConfig & {
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
};
