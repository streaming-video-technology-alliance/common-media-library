import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import { emitToEventTargets } from './emitToEventTargets.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'

/**
 * Emits one event for one reporter to every event target of the current `sid` state that lists it.
 * The `sid` state is captured once, so a transform that rotates does not move the remaining targets.
 * `reporter` is `undefined` for a session-only line. The first error is rethrown after every target ran.
 */
export function emitEvent(session: SessionState, reporter: ReporterState | undefined, event: string, data: CmcdPlaybackData | undefined, request: Readonly<CmcdRequestLike> | undefined, ts: number): void {
	emitToEventTargets(session, session.current, reporter, event, data, request, ts, undefined, false)
}
