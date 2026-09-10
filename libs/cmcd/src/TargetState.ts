import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { ReporterState } from './ReporterState.ts'
import type { TargetEntry } from './TargetEntry.ts'

/** One destination inside one `sid` state. `index` is the position in the event target list, `-1` for the request target. */
export type TargetState = {
	readonly kind: CmcdReportingMode
	readonly index: number
	sn: number
	msdSent: boolean
	readonly bsdCursors: Map<string, number>
	readonly entries: Map<ReporterState, TargetEntry>
	readonly queue: string[]
	attempt: number
	retryTimer: ReturnType<typeof setTimeout> | undefined
	sending: boolean
	drainRequested: boolean
	gone: boolean
}
