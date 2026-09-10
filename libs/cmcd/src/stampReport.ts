import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdSessionState, CmcdTargetStamps } from './CmcdSessionState.ts'

/**
 * Stamps the reporter-owned fields on a report: `e` when the report is an
 * event report, then `sn` and `sid`, and `msd` while the session holds one
 * this `stamps` has not sent.
 *
 * `msd` rides once per `stamps`: once per target in event mode, once per
 * session in request mode. The caller's key filter runs later, in report
 * preparation, and the caller consumes the gate only when the prepared
 * report retained `msd`, so a target that filters `msd` out does not
 * consume it. A value smuggled in via per-call data or a transform is
 * stripped regardless, so the gate stays the single source of
 * once-per-session semantics.
 *
 * `sn` is written from `stamps.sn` without incrementing it, and
 * `stamps.msdSent` is not set here. This is the write half of a two-phase
 * contract. The caller commits `stamps.sn++`, plus `stamps.msdSent = true`
 * when the prepared report retained `msd`, only once the report has gone
 * out: prepared, encoded, and queued in event mode, or prepared, encoded,
 * and attached to the request in request mode. A report that fails partway
 * through therefore consumes neither a sequence number nor the session's
 * `msd`.
 *
 * @param report - The report to stamp.
 * @param session - The session the report belongs to; supplies `sid` and `msd`.
 * @param stamps - The target's (or request target's) counters and gate.
 * @param type - The event type to stamp onto `e`; omitted for a request report.
 *
 * @internal
 */
export function stampReport<C>(report: Cmcd, session: CmcdSessionState<C>, stamps: CmcdTargetStamps, type?: CmcdEventType): void {
	if (type !== undefined) {
		report.e = type
	}

	report.sn = stamps.sn
	report.sid = session.sid

	if (!isNaN(session.msd) && !stamps.msdSent) {
		report.msd = session.msd
	}
	else {
		delete report.msd
	}
}
