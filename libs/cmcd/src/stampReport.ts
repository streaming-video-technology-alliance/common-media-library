import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdSessionState, CmcdTargetStamps } from './CmcdSessionState.ts'

/**
 * Stamps the reporter-owned fields on a report: `e` when the report is an
 * event report, then `sn` and `sid`, and `msd` when the gate is open.
 *
 * `msd` may only ride a report when the caller's key filter will retain it
 * (`attachMsd`) — msd is never force-added at encode time, so consuming the
 * gate for a report that filters it out would silently drop it for the
 * session — and only once per `stamps` (once per target in event mode, once
 * per session in request mode). A value smuggled in via per-call data or a
 * transform is stripped regardless, so the gate stays the single source of
 * once-per-session semantics.
 *
 * `sn` is written from `stamps.sn` without incrementing it, and this
 * function only reports whether `msd` attached; it does not set
 * `stamps.msdSent`. This is the read half of a two-phase contract: the
 * caller commits both `stamps.sn++` and, when this returns `true`,
 * `stamps.msdSent = true`, only once the report has actually gone out —
 * encoded and queued (event mode), or prepared, encoded, and attached to the
 * request (request mode) — so a report that fails partway through consumes
 * neither a sequence number nor the session's `msd`.
 *
 * @param report - The report to stamp.
 * @param session - The session the report belongs to; supplies `sid` and `msd`.
 * @param stamps - The target's (or request target's) counters and gate.
 * @param attachMsd - Whether the caller's key filter would retain `msd`.
 * @param type - The event type to stamp onto `e`; omitted for a request report.
 * @returns Whether `msd` rode the report.
 */
export function stampReport<C>(report: Cmcd, session: CmcdSessionState<C>, stamps: CmcdTargetStamps, attachMsd: boolean, type?: CmcdEventType): boolean {
	if (type !== undefined) {
		report.e = type
	}

	report.sn = stamps.sn
	report.sid = session.sid

	if (attachMsd && !isNaN(session.msd) && !stamps.msdSent) {
		report.msd = session.msd
		return true
	}

	delete report.msd
	return false
}
