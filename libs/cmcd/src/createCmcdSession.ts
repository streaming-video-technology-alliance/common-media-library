import { uuid } from '@svta/cml-utils'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { configureSession } from './configureSession.ts'
import { createSessionReporter } from './createSessionReporter.ts'
import { createSidState } from './createSidState.ts'
import { normalizeSessionConfig } from './normalizeSessionConfig.ts'
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
		rotate(sid) {
			if (state.disposed) {
				return
			}
			const next = sid ?? uuid()
			if (next === state.current.sid) {
				return
			}
			state.current.ended = true
			state.current = createSidState(next, state.config)
			for (const reporter of state.reporters) {
				reporter.reported.sta = undefined
				reporter.reported.pr = undefined
				reporter.reported.cid = undefined
				reporter.reported.br = undefined
				reporter.spanOpenedAt = undefined
			}
		},
		configure: settings => configureSession(state, settings),
		flush() {
			// Event mode delivery is not implemented yet.
		},
		dispose() {
			state.disposed = true
			state.current.ended = true
			for (const reporter of state.reporters) {
				reporter.disposed = true
			}
		},
	}
	return session
}
