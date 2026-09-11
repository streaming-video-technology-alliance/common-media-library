import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/** What preparation needs to know about the report it prepares. */
export type PrepareContext = {
	readonly version: CmcdVersion
	readonly mode: CmcdReportingMode
	readonly event: string | undefined
	readonly keys: ReadonlySet<string> | undefined
	readonly baseUrl: string | undefined
}
