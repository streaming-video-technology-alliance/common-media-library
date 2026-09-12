import type { BaseParts } from './BaseParts.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/** What preparation needs to know about the report it prepares. */
export type PrepareContext = {
	readonly version: CmcdVersion
	readonly mode: CmcdReportingMode
	readonly event: string | undefined
	readonly keys: ReadonlySet<string> | undefined
	readonly baseUrl: string | undefined
	/** The parsed `baseUrl`, resolved once by the caller so `nor` relativization does not re-parse it. */
	readonly base?: BaseParts | null
}
