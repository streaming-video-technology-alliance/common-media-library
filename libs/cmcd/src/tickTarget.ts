import { CMCD_EVENT_TIME_INTERVAL } from './CmcdEventType.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import { reportSessionError } from './reportSessionError.ts'
import type { SessionState } from './SessionState.ts'

/** One interval tick of one event target: one `t` line per live reporter, or one session-only line. */
export function tickTarget(session: SessionState, index: number): void {
	if (session.disposed) {
		return
	}
	const sidState = session.current
	const target = sidState.eventTargets[index]
	if (!target || target.gone) {
		return
	}
	const ts = Date.now()
	const reporters = session.reporters.size > 0 ? [...session.reporters] : [undefined]
	let failure: unknown
	let failed = false
	for (const reporter of reporters) {
		try {
			const assembled = assembleReport(session, sidState, target, reporter, CMCD_EVENT_TIME_INTERVAL, undefined, ts)
			emitReport(session, sidState, target, reporter, assembled, CMCD_EVENT_TIME_INTERVAL, undefined)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	processQueue(session, sidState, target, false)
	if (failed) {
		reportSessionError(session, failure)
	}
}
