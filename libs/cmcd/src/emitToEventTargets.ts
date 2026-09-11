import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/**
 * Emits one event to every event target of `sidState` that lists it, then processes each target's queue.
 * `drain` asks every processed target to send its whole queue at once. The first error is rethrown after every target ran.
 */
export function emitToEventTargets(session: SessionState, sidState: SidState, reporter: ReporterState | undefined, event: string, data: Record<string, unknown> | undefined, request: Readonly<CmcdRequestLike> | undefined, ts: number, store: Record<string, unknown> | undefined, drain: boolean): void {
	const targets: TargetState[] = []
	let failure: unknown
	let failed = false
	for (const target of sidState.eventTargets) {
		if (target.gone || !session.config.eventTargets[target.index].events.has(event)) {
			continue
		}
		try {
			const assembled = assembleReport(session, sidState, target, reporter, event, data, ts, store)
			emitReport(session, sidState, target, reporter, assembled, event, request)
			targets.push(target)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	for (const target of targets) {
		processQueue(session, sidState, target, drain)
	}
	if (failed) {
		throw failure
	}
}
