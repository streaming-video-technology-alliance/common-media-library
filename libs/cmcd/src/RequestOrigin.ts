import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SidState } from './SidState.ts'

/** What a decorated request remembers for its response. `data` is a copy. `startedAt` is absent for a request that was not decorated. */
export type RequestOrigin = {
	readonly reporter: ReporterState
	readonly sidState: SidState
	readonly cid: string | undefined
	readonly data: CmcdPlaybackData | undefined
	readonly startedAt: number | undefined
}
