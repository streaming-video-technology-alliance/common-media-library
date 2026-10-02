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
	 * The list of CMCD keys to include in the report. If omitted, no keys
	 * are reported. In event mode, this list cannot remove `e`, `ts`, or the
	 * required key of the event type. Examples of required keys: `sta` for a
	 * play state change, `ec` for an error, `url` for a response received.
	 *
	 * @defaultValue `undefined`
	 */
	enabledKeys?: CmcdKey[];
}
