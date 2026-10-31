import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'

/**
 * The configuration of a CMCD session.
 *
 * The members of {@link CmcdSessionRequestReportConfig} are the request mode settings. `configure()` replaces them.
 *
 * @public
 */
export type CmcdSessionConfig = CmcdSessionRequestReportConfig & {
	/**
	 * The session ID, a string of 1 to 64 characters.
	 *
	 * @defaultValue A new UUID
	 */
	sid?: string

	/**
	 * The content ID of each report whose data has no `cid`. It has at most 128 characters.
	 */
	cid?: string
}
