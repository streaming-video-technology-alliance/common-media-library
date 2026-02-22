import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Options for formatting CMCD data values.
 *
 * @public
 */
export type CmcdFormatterOptions = {
	/**
	 * The version of the CMCD specification to use.
	 */
	version: CmcdVersion;

	/**
	 * The reporting mode to use.
	 */
	reportingMode: CmcdReportingMode;

	/**
	 * The base URL to use for relative URLs.
	 */
	baseUrl?: string;
};
