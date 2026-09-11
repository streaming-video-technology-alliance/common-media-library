import { CMCD_EVENT_BACKGROUNDED_MODE } from './CmcdEventType.ts'
import { emitEvent } from './emitEvent.ts'
import type { SessionState } from './SessionState.ts'

/** Emits `b` for every live reporter when the session `bg` differs from the last reported value of the current `sid`. */
export function emitBackgroundChange(session: SessionState, ts: number): void {
	const sidState = session.current
	if (session.bg === sidState.bgReported) {
		return
	}
	sidState.bgReported = session.bg
	const reporters = session.reporters.size > 0 ? [...session.reporters] : [undefined]
	let failure: unknown
	let failed = false
	for (const reporter of reporters) {
		try {
			emitEvent(session, reporter, CMCD_EVENT_BACKGROUNDED_MODE, undefined, undefined, ts)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	if (failed) {
		throw failure
	}
}
