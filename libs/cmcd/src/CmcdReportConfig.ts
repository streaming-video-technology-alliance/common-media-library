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
	 * all keys will be reported.
	 *
	 * @defaultValue `undefined`
	 */
	enabledKeys?: CmcdKey[];
}
