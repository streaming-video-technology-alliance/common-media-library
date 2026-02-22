import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Options for CMCD validation functions.
 *
 * @public
 */
export type CmcdValidationOptions = {
	/**
	 * Explicit CMCD version override. If not provided, the version is
	 * inferred from the payload's `v` key, defaulting to 1.
	 */
	version?: CmcdVersion

	/**
	 * The reporting mode of the payload.
	 */
	reportingMode?: CmcdReportingMode
}
