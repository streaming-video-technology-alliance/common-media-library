import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { TargetState } from './TargetState.ts'

/**
 * Emits one event for one reporter to every event target of the current `sid` state that lists it.
 * The `sid` state is captured once, so a transform that rotates does not move the remaining targets.
 * `reporter` is `undefined` for a session-only line. The first error is rethrown after every target ran.
 */
export function emitEvent(session: SessionState, reporter: ReporterState | undefined, event: string, data: CmcdPlaybackData | undefined, request: Readonly<CmcdRequestLike> | undefined, ts: number): void {
	const sidState = session.current
	const targets: TargetState[] = []
	let failure: unknown
	let failed = false
	for (const target of sidState.eventTargets) {
		if (target.gone || !session.config.eventTargets[target.index].events.has(event)) {
			continue
		}
		try {
			const assembled = assembleReport(session, sidState, target, reporter, event, data, ts)
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
		processQueue(session, sidState, target, false)
	}
	if (failed) {
		throw failure
	}
}
