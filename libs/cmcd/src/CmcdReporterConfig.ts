import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * Configuration for a CMCD reporting component.
 *
 * @typeParam C - The type of the player's `customData` on the requests this
 *                reporter receives. If one `transform` is annotated, the rest
 *                of the configuration infers the type. Defaults to
 *                `Record<string, unknown>`.
 *
 * @public
 */
export type CmcdReporterConfig<C = Record<string, unknown>> = CmcdRequestReportConfig<C> & {
	/**
	 * The session ID. If omitted, the reporter generates a new random session ID.
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
	 * The event configurations. If omitted, no events are reported.
	 *
	 * @defaultValue `undefined`
	 */
	eventTargets?: CmcdEventReportConfig<C>[];

	/**
	 * The number of ended sessions the reporter retains state for, in
	 * addition to the current one. Retained sessions let a response that
	 * completes after a `sid` change report under the session that issued
	 * its request. The report uses that session's data snapshot and
	 * sequence numbers. `0` retains nothing, so stale responses are
	 * dropped. `Infinity` never evicts, which also retains every session's
	 * unsent report queues. Numbers are floored. Every other input uses
	 * the default.
	 *
	 * @defaultValue 2
	 */
	sessionRetention?: number;
}
