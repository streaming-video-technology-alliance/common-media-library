import { CMCD_EVENT_MODE, CMCD_REQUEST_MODE } from './CmcdReportingMode.ts'
import { createTargetState } from './createTargetState.ts'
import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'
import type { SidState } from './SidState.ts'

/** A fresh `sid` state with one target state per destination. */
export function createSidState(sid: string, config: NormalizedSessionConfig): SidState {
	return {
		sid,
		ended: false,
		requestTarget: createTargetState(CMCD_REQUEST_MODE, -1),
		eventTargets: config.eventTargets.map((_, index) => createTargetState(CMCD_EVENT_MODE, index)),
		bgReported: undefined,
		msd: undefined,
		msdSupplied: false,
		msdStart: undefined,
		bsa: 0,
		bsda: 0,
		bsaSupplied: undefined,
		bsdaSupplied: undefined,
		bsdSupplied: false,
		pending: new Map(),
		stores: new Map(),
	}
}
