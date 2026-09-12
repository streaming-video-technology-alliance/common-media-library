import type { BaseParts } from './BaseParts.ts'
import type { SessionState } from './SessionState.ts'

/** The state of one reporter. `reported` holds the last reported value of each tracked field. */
export type ReporterState = {
	readonly session: SessionState
	readonly store: Record<string, unknown>
	readonly reported: { sta?: unknown; pr?: unknown; cid?: unknown; br?: unknown }
	host: string | undefined
	hostOrigin: string | undefined
	baseKey: string | undefined
	baseParts: BaseParts | null
	hSupplied: boolean
	su: boolean | undefined
	suSupplied: boolean
	dlSupplied: boolean
	spanOpenedAt: number | undefined
	disposed: boolean
}
