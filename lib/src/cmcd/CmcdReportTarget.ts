import type { CmcdKey } from './CmcdKey.js';
import type { CmcdReportingMode } from './CmcdReportingMode.js';
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.js';

/**
 * A CMCD report target configuration.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdReportTarget = {
	/**
	 * The URL to which the CMCD report should be sent.
	 */
	url: string;

	/**
	 * The reporting mode for the CMCD report.
	 *
	 * @defaultValue `'request'`
	 */
	reportingMode?: CmcdReportingMode;

	/**
	 * The HTTP method to use for the CMCD report.
	 *
	 * @defaultValue `'GET'`
	 */
	method?: 'GET' | 'POST';

	/**
	 * The version of the CMCD report.
	 *
	 * @defaultValue `2`
	 */
	version?: number;

	/**
	 * The transmission mode for the CMCD report.
	 *
	 * @defaultValue `'query'`
	 */
	transmissionMode?: CmcdTransmissionMode;

	/**
	 * The list of CMCD keys to include in the report.
	 */
	enabledKeys?: CmcdKey[];
};
