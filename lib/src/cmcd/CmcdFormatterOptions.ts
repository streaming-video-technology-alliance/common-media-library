import type { CmcdReportingMode } from './CmcdReportingMode.js';

/**
 * Options for formatting CMCD data values.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdFormatterOptions = {
	/**
	 * The version of the CMCD specification to use.
	 *
	 * @defaultValue `1`
	 */
	version: number;

	/**
	 * The reporting mode to use.
	 *
	 * @defaultValue `CmcdReportingMode.REQUEST`
	 */
	reportingMode: CmcdReportingMode;

	/**
	 * The base URL to use for relative URLs.
	 */
	baseUrl?: string;
};
