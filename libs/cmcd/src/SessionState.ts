import type { NormalizedSessionConfig } from './NormalizedSessionConfig.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SidState } from './SidState.ts'

/** The state of one session. `reporters` is in creation order. */
export type SessionState = {
	config: NormalizedSessionConfig
	readonly reporters: Set<ReporterState>
	current: SidState
	readonly timers: ReturnType<typeof setInterval>[]
	bg: boolean | undefined
	bgSupplied: boolean
	stopVisibility: (() => void) | undefined
	disposed: boolean
}
