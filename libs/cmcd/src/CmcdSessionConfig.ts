import type { CmcdSessionEventReportConfig } from './CmcdSessionEventReportConfig.ts'
import type { CmcdSessionRequestReportConfig } from './CmcdSessionRequestReportConfig.ts'
import type { CmcdSnapshot } from './CmcdSnapshot.ts'

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
	 * Each target is one destination. It has its own sequence number, `msd` rule, and waiting values.
	 */
	eventTargets?: readonly CmcdSessionEventReportConfig[]

	/**
	 * Returns the data of each `t` report. The other reports use only the data of their call.
	 * Without `snapshot`, `start()` arms no timer.
	 */
	snapshot?: () => CmcdSnapshot
}
