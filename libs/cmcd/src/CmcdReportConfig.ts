import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Configuration for a CMCD report.
 *
 * @public
 */
export type CmcdReportConfig = {
	/**
	 * The version of the CMCD specification to use.
	 *
	 * @defaultValue `CMCD_V2`
	 */
	version?: CmcdVersion;

	/**
	 * The list of CMCD keys to include in the report. If not provided,
	 * no keys will be reported, unless there are other configuration
	 * options that require keys to be reported, specifically in event mode.
	 *
	 * @defaultValue `undefined`
	 */
	enabledKeys?: CmcdKey[];
}
