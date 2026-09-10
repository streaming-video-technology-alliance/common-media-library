import { CMCD_V2 } from './CMCD_V2.ts'
import { CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/** The most pending samples kept per cause. Older samples are dropped past the cap. */
export const BSD_PENDING_CAP = 100

/** Whether a target can ever carry `bsd`: not gone, `bsd` in its keys, and version 2 for the request target. */
export function isBsdEligible(session: SessionState, target: TargetState): boolean {
	if (target.gone) {
		return false
	}
	if (target.kind === CMCD_REQUEST_MODE) {
		return session.config.version === CMCD_V2 && (session.config.keys === undefined || session.config.keys.has('bsd'))
	}
	const keys = session.config.eventTargets[target.index]?.keys
	return keys === undefined || keys.has('bsd')
}

/** Drops from every pending list the prefix that every eligible target has consumed, and moves the cursors back. */
export function pruneSpans(session: SessionState, sidState: SidState): void {
	const eligible = [sidState.requestTarget, ...sidState.eventTargets].filter(target => isBsdEligible(session, target))
	for (const [cause, samples] of sidState.pending) {
		const consumed = eligible.length === 0 ? samples.length : Math.min(...eligible.map(target => target.bsdCursors.get(cause) ?? 0))
		if (consumed === 0) {
			continue
		}
		samples.splice(0, consumed)
		for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
			target.bsdCursors.set(cause, Math.max(0, (target.bsdCursors.get(cause) ?? 0) - consumed))
		}
		if (samples.length === 0) {
			sidState.pending.delete(cause)
		}
	}
}

/** Appends one `bsd` sample when a target can carry it, and enforces the cap. */
export function addSpan(session: SessionState, sidState: SidState, cause: string, duration: number): void {
	const targets = [sidState.requestTarget, ...sidState.eventTargets]
	if (!targets.some(target => isBsdEligible(session, target))) {
		return
	}
	let samples = sidState.pending.get(cause)
	if (!samples) {
		samples = []
		sidState.pending.set(cause, samples)
	}
	samples.push(duration)
	if (samples.length > BSD_PENDING_CAP) {
		samples.shift()
		for (const target of targets) {
			target.bsdCursors.set(cause, Math.max(0, (target.bsdCursors.get(cause) ?? 0) - 1))
		}
	}
}
