import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * Configuration for a CMCD reporting component.
 *
 * @public
 */
export type CmcdReporterConfig = CmcdRequestReportConfig & {
	/**
	 * The session ID. If not provided, a new random session ID will be generated.
	 *
	 * @defaultValue `undefined`
	 */
	sid?: string;

	/**
	 * The content ID.
	 *
	 * @defaultValue `undefined`
	 */
	cid?: string;

	/**
	 * The event configurations. If not provided, no events will be reported.
	 *
	 * @defaultValue `undefined`
	 */
	eventTargets?: CmcdEventReportConfig[];
}
