import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import { checkRequestSettings } from './checkRequestSettings.ts'
import type { SessionState } from './SessionState.ts'

/** Replaces the request-mode settings. The request target reads them at the next `decorate()`. Nothing else changes. */
export function configureSession(state: SessionState, settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void {
	if (state.disposed) {
		return
	}
	checkRequestSettings(settings)
	if (settings.version !== undefined) {
		state.config.version = settings.version
	}
	if (settings.transmissionMode !== undefined) {
		state.config.transmissionMode = settings.transmissionMode
	}
	if (settings.keys !== undefined) {
		state.config.keys = new Set(settings.keys)
	}
	if (settings.headerMap !== undefined) {
		state.config.headerMap = settings.headerMap
	}
}
