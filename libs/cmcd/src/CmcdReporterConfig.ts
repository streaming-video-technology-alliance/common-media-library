import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * Configuration for a CMCD reporting component.
 *
 * @typeParam C - The shape of the player's `customData` on the requests this
 *                reporter sees. Annotating a single `transform` is enough for
 *                the rest of the configuration to infer it. Defaults to
 *                `Record<string, unknown>`.
 *
 * @public
 */
export type CmcdReporterConfig<C = Record<string, unknown>> = CmcdRequestReportConfig<C> & {
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
	eventTargets?: CmcdEventReportConfig<C>[];

	/**
	 * The number of ended sessions the reporter retains state for, in
	 * addition to the current one. Retained sessions let a response that
	 * completes after a `sid` change report under the session that issued
	 * its request, with that session's data snapshot and sequence numbers.
	 * `0` retains nothing, so stale responses are dropped. `Infinity` never
	 * evicts, which also retains every session's unsent report queues.
	 * Numbers are floored; every other input falls back to the default.
	 *
	 * @defaultValue 2
	 */
	sessionRetention?: number;
}
