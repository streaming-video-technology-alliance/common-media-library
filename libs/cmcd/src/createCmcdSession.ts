import { uuid } from '@svta/cml-utils'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { armTimers } from './armTimers.ts'
import { configureSession } from './configureSession.ts'
import { createSessionReporter } from './createSessionReporter.ts'
import { createSidState } from './createSidState.ts'
import { disposeSession } from './disposeSession.ts'
import { emitBackgroundChange } from './emitBackgroundChange.ts'
import { flushSession } from './flushSession.ts'
import { normalizeSessionConfig } from './normalizeSessionConfig.ts'
import { observeVisibility } from './observeVisibility.ts'
import { reportSessionError } from './reportSessionError.ts'
import { rotateSession } from './rotateSession.ts'
import type { SessionState } from './SessionState.ts'

/**
 * Creates a CMCD session. One session per playback, one reporter per media player.
 *
 * @example
 * {@includeCode ../test/createCmcdSession.test.ts#example}
 *
 * @public
 */
export function createCmcdSession(config: CmcdSessionConfig = {}): CmcdSession {
	const normalized = normalizeSessionConfig(config)
	const state: SessionState = {
		config: normalized,
		reporters: new Set(),
		current: createSidState(config.sid ?? uuid(), normalized),
		timers: [],
		bg: undefined,
		bgSupplied: false,
		stopVisibility: undefined,
		disposed: false,
	}
	const session: CmcdSession = {
		get sid() {
			return state.current.sid
		},
		createReporter: reporterConfig => createSessionReporter(state, session, reporterConfig),
		rotate: sid => rotateSession(state, sid),
		configure: settings => configureSession(state, settings),
		flush: () => flushSession(state),
		dispose: () => disposeSession(state),
	}
	if (normalized.derive.bg) {
		state.stopVisibility = observeVisibility((hidden) => {
			if (state.disposed || state.bgSupplied) {
				return
			}
			state.bg = hidden ? true : undefined
			try {
				emitBackgroundChange(state, Date.now())
			}
			catch (error) {
				reportSessionError(state, error)
			}
		})
		if (state.stopVisibility && document.visibilityState === 'hidden') {
			state.bg = true
			state.current.bgReported = true
		}
	}
	armTimers(state)
	return session
}
