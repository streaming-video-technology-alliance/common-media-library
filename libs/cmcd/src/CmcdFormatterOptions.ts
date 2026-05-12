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
	 * Base URL (typically the manifest or current request URL) used to convert absolute `nor` values
	 * into paths relative to this base, per the CMCD specification. Values that are already relative
	 * paths are passed through unchanged. When omitted, `nor` values are emitted as-is.
	 */
	baseUrl?: string;
};
