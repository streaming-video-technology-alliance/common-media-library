import type { CmcdMetric } from './CmcdMetric.ts'
import type { ReporterState } from './ReporterState.ts'
import type { TargetState } from './TargetState.ts'

/** Everything that resets with a `sid`. `pending` holds the `bsd` samples per cause, automatic spans under the empty key. */
export type SidState = {
	readonly sid: string
	ended: boolean
	readonly requestTarget: TargetState
	readonly eventTargets: readonly TargetState[]
	bgReported: boolean | undefined
	msd: number | undefined
	msdSupplied: boolean
	msdStart: number | undefined
	bsa: number
	bsda: number
	bsaSupplied: CmcdMetric | undefined
	bsdaSupplied: CmcdMetric | undefined
	bsdSupplied: boolean
	readonly pending: Map<string, number[]>
	readonly stores: Map<ReporterState, Record<string, unknown>>
}
