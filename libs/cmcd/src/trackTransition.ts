import { getTargetEntry } from './getTargetEntry.ts'
import { addSpan } from './pruneSpans.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'

/**
 * The effects of a `sta` transition, per the design record's transition table. Runs before the state-change diff,
 * so the `ps` report carries what the transition derived.
 */
export function trackTransition(session: SessionState, reporter: ReporterState, previous: unknown, next: unknown, ts: number): void {
	const sidState = session.current
	if (next === 's' && sidState.msdStart === undefined) {
		sidState.msdStart = ts
	}
	if (next === 'p' && sidState.msdStart !== undefined && sidState.msd === undefined && !sidState.msdSupplied) {
		sidState.msd = Math.max(0, ts - sidState.msdStart)
	}
	if (next === 'r') {
		reporter.spanOpenedAt = ts
		if (sidState.bsaSupplied === undefined) {
			sidState.bsa += 1
		}
		for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
			getTargetEntry(target, reporter).bs = true
		}
	}
	if (previous === 'r' && next !== 'r' && reporter.spanOpenedAt !== undefined) {
		const duration = Math.max(0, ts - reporter.spanOpenedAt)
		reporter.spanOpenedAt = undefined
		if (sidState.bsdaSupplied === undefined) {
			sidState.bsda += duration
		}
		if (!sidState.bsdSupplied) {
			addSpan(session, sidState, '', duration)
		}
	}
	if (next === 's' || next === 'k' || next === 'r') {
		reporter.su = true
	}
	else if (next === 'p') {
		reporter.su = false
	}
}
