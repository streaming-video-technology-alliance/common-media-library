import { uuid } from '@svta/cml-utils'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import { checkSid } from './checkRequestSettings.ts'
import { copyPlaybackData } from './copyPlaybackData.ts'
import { createSidState } from './createSidState.ts'
import { getTargetEntry } from './getTargetEntry.ts'
import { processQueue } from './processQueue.ts'
import type { SessionState } from './SessionState.ts'

/**
 * Starts the next `sid`. The old state is drained and ended. Each reporter's store is copied onto it for late responses.
 * Every counter, gate, buffer, and baseline restarts, and a startup measurement in progress carries over.
 * The new `sid` inherits the current visibility as its `bg` baseline, so the next change still emits `b`.
 * A reporter that is rebuffering keeps `bs` and measures the stall from the rotation time.
 * The new `sid` counts that stall in `bsa`. Emits nothing.
 */
export function rotateSession(state: SessionState, sid: string | undefined): void {
	if (state.disposed) {
		return
	}
	const next = sid ?? uuid()
	checkSid(next)
	const old = state.current
	if (next === old.sid) {
		return
	}
	old.ended = true
	for (const target of old.eventTargets) {
		if (target.retryTimer !== undefined) {
			clearTimeout(target.retryTimer)
			target.retryTimer = undefined
		}
		processQueue(state, old, target, true)
	}
	for (const reporter of state.reporters) {
		old.stores.set(reporter, copyPlaybackData(reporter.store as CmcdPlaybackData) as Record<string, unknown>)
	}
	const fresh = createSidState(next, state.config)
	fresh.bgReported = state.bg
	if (old.msd === undefined && !old.msdSupplied && old.msdStart !== undefined) {
		fresh.msdStart = old.msdStart
	}
	const now = Date.now()
	for (const reporter of state.reporters) {
		reporter.reported.sta = undefined
		reporter.reported.pr = undefined
		reporter.reported.cid = undefined
		reporter.reported.br = undefined
		if (reporter.store['sta'] === 'r') {
			reporter.spanOpenedAt = now
			fresh.bsa += 1
			for (const target of [fresh.requestTarget, ...fresh.eventTargets]) {
				getTargetEntry(target, reporter).bs = true
			}
		}
		else {
			reporter.spanOpenedAt = undefined
		}
	}
	state.current = fresh
}
