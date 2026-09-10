import { processQueue } from './processQueue.ts'
import type { SessionState } from './SessionState.ts'

/** Sends every queued line of the current `sid` state now. An armed retry fires at once. */
export function flushSession(session: SessionState): void {
	if (session.disposed) {
		return
	}
	for (const target of session.current.eventTargets) {
		if (target.retryTimer !== undefined) {
			clearTimeout(target.retryTimer)
			target.retryTimer = undefined
		}
		processQueue(session, session.current, target, true)
	}
}
