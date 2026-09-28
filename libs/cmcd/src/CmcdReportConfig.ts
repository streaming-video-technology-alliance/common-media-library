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
	 * are reported. In event mode, `e`, `ts`, and the key that CTA-5004-B
	 * requires for the event type are reported even when this list omits
	 * them. Examples of required keys: `sta` for a play state change, `ec`
	 * for an error, `url` for a response received.
	 *
	 * @defaultValue `undefined`
	 */
	enabledKeys?: CmcdKey[];
}
