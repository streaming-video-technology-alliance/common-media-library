import type { Cmcd } from './Cmcd.ts'
import type { CmcdOutbox } from './CmcdOutbox.ts'
import type { CmcdEventReportConfigNormalized } from './createCmcdReporterConfig.ts'

/**
 * The key the current session's request-report counters are stored under.
 *
 * @internal
 */
export const CMCD_DEFAULT_REQUEST_TARGET = 'default'

/**
 * One target's per-session report state: its `sn` sequence counter and its
 * once-per-session `msd` send gate.
 *
 * @internal
 */
export type CmcdTargetStamps = {
	sn: number;
	msdSent: boolean;
}

/**
 * Creates the counters and gate one target starts a session with.
 *
 * @internal
 */
export function createTargetStamps(): CmcdTargetStamps {
	return { sn: 0, msdSent: false }
}

/**
 * Returns the session's counters for one request target. A target that has
 * no entry yet gets a fresh one, stored for the next call.
 *
 * @internal
 */
export function resolveRequestTarget<C>(session: CmcdSessionState<C>, target: string): CmcdTargetStamps {
	let stamps = session.requestTargets.get(target)

	if (!stamps) {
		stamps = createTargetStamps()
		session.requestTargets.set(target, stamps)
	}

	return stamps
}

/**
 * The target's outbox holds finished, encoded report lines awaiting send.
 * Reports are encoded at enqueue, so a value that cannot serialize throws
 * inside the recording call, and a queued line is immune to later
 * mutation of the values it was built from.
 *
 * @internal
 */
export type CmcdEventTargetState = CmcdTargetStamps & {
	outbox: CmcdOutbox;
}

/**
 * The state owned by one session (one `sid`). Everything CTA-5004-B scopes
 * to the session lives here, so a report that belongs to an earlier session
 * (a response completing after a `sid` change, a re-queued batch) is built
 * from and accounted against its own session rather than the current one.
 *
 * @internal
 */
export type CmcdSessionState<C> = {
	sid: string;
	/** Retention order, stamped by the ledger on insert; oldest first. */
	seq: number;
	msd: number;
	bg?: boolean;
	bgEmitted?: boolean;
	/**
	 * Per-playback data snapshots frozen when the session ended, keyed by
	 * playback id. Empty while the session is live: its reports read the
	 * playback's own store. An archived session's reports read the
	 * snapshot, so a late response is built from the data the session held
	 * when it ended.
	 */
	snapshots: Map<string, Cmcd>;
	eventTargets: Map<CmcdEventReportConfigNormalized<C>, CmcdEventTargetState>;
	requestTargets: Map<string, CmcdTargetStamps>;
}

/**
 * Creates the state for a new session: fresh counters and send gate for
 * the default request target, and an empty event-target map for the caller
 * to populate. `bg` is session-owned but carries across a session change,
 * so it is passed in. Its dedup baseline, `bgEmitted`, starts empty.
 *
 * @internal
 */
export function createCmcdSessionState<C>(sid: string, bg: boolean | undefined): CmcdSessionState<C> {
	return {
		sid,
		seq: 0,
		msd: NaN,
		bg,
		bgEmitted: undefined,
		snapshots: new Map(),
		eventTargets: new Map<CmcdEventReportConfigNormalized<C>, CmcdEventTargetState>(),
		requestTargets: new Map([[CMCD_DEFAULT_REQUEST_TARGET, createTargetStamps()]]),
	}
}
