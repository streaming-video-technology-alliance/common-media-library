import type { SessionState } from './SessionState.ts'

/** Gives an error that has no caller to `onError`, or throws it from a timer callback when `onError` is absent. */
export function reportSessionError(session: SessionState, error: unknown): void {
	if (session.config.onError) {
		session.config.onError(error)
		return
	}
	setTimeout(() => {
		throw error
	}, 0)
}
