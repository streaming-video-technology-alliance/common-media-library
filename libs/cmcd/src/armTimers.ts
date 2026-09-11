import { CMCD_EVENT_TIME_INTERVAL } from './CmcdEventType.ts'
import type { SessionState } from './SessionState.ts'
import { tickTarget } from './tickTarget.ts'

/** One interval timer per event target that lists `t` with an interval over zero. */
export function armTimers(session: SessionState): void {
	session.config.eventTargets.forEach((target, index) => {
		if (target.interval > 0 && target.events.has(CMCD_EVENT_TIME_INTERVAL)) {
			session.timers.push(setInterval(() => tickTarget(session, index), target.interval))
		}
	})
}
