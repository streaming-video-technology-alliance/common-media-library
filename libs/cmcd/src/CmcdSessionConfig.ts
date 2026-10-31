import type { CmcdSessionEventReportConfig } from './CmcdSessionEventReportConfig.ts'
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

	/**
	 * The event targets. They cannot change after the session is created.
	 * Each target is one destination with its own sequence number.
	 */
	eventTargets?: readonly CmcdSessionEventReportConfig[]
}
