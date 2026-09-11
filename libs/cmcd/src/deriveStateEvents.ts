import { CMCD_EVENT_BITRATE_CHANGE, CMCD_EVENT_CONTENT_ID, CMCD_EVENT_PLAY_STATE, CMCD_EVENT_PLAYBACK_RATE } from './CmcdEventType.ts'
import { emitBackgroundChange } from './emitBackgroundChange.ts'
import { emitEvent } from './emitEvent.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'

/** Two metric values are the same when they are the same number, or records with the same entries. */
export function sameMetric(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true
	}
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
		return false
	}
	const left = a as Record<string, unknown>
	const right = b as Record<string, unknown>
	const keys = Object.keys(left)
	return keys.length === Object.keys(right).length && keys.every(key => left[key] === right[key])
}

/**
 * Emits the state-change events the store implies, in the order `sta`, `pr`, `cid`, `bg`, `br`. A field emits when
 * its value is defined and differs from the last value this reporter reported. `pr` emits only while `sta` is `p`.
 */
export function deriveStateEvents(session: SessionState, reporter: ReporterState, ts: number): void {
	const { store, reported } = reporter
	if (store['sta'] !== undefined && store['sta'] !== reported.sta) {
		reported.sta = store['sta']
		emitEvent(session, reporter, CMCD_EVENT_PLAY_STATE, undefined, undefined, ts)
	}
	if (store['sta'] === 'p' && store['pr'] !== undefined && store['pr'] !== reported.pr) {
		reported.pr = store['pr']
		emitEvent(session, reporter, CMCD_EVENT_PLAYBACK_RATE, undefined, undefined, ts)
	}
	if (store['cid'] !== undefined && store['cid'] !== reported.cid) {
		reported.cid = store['cid']
		emitEvent(session, reporter, CMCD_EVENT_CONTENT_ID, undefined, undefined, ts)
	}
	emitBackgroundChange(session, ts)
	if (store['br'] !== undefined && !sameMetric(store['br'], reported.br)) {
		reported.br = typeof store['br'] === 'object' ? { ...(store['br'] as Record<string, unknown>) } : store['br']
		emitEvent(session, reporter, CMCD_EVENT_BITRATE_CHANGE, undefined, undefined, ts)
	}
}
