import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { TargetState } from './TargetState.ts'

/** A fresh target state. `index` is `-1` for the request target. */
export function createTargetState(kind: CmcdReportingMode, index: number): TargetState {
	return {
		kind,
		index,
		sn: 0,
		msdSent: false,
		bsdCursors: new Map(),
		entries: new Map(),
		queue: [],
		attempt: 0,
		retryTimer: undefined,
		sending: false,
		drainRequested: false,
		gone: false,
	}
}
