import { processQueue } from './processQueue.ts'
import type { SessionState } from './SessionState.ts'

/** Ends the session: timers off, reporters disposed, the current `sid` state ended, every queue drained. */
export function disposeSession(session: SessionState): void {
	if (session.disposed) {
		return
	}
	session.disposed = true
	for (const timer of session.timers) {
		clearInterval(timer)
	}
	session.timers.length = 0
	session.stopVisibility?.()
	session.stopVisibility = undefined
	for (const reporter of session.reporters) {
		reporter.disposed = true
	}
	const sidState = session.current
	sidState.ended = true
	for (const target of sidState.eventTargets) {
		if (target.retryTimer !== undefined) {
			clearTimeout(target.retryTimer)
			target.retryTimer = undefined
		}
		processQueue(session, sidState, target, true)
	}
}
