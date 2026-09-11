import type { CmcdSessionConfig } from './CmcdSessionConfig.ts'
import type { CmcdSessionReporter } from './CmcdSessionReporter.ts'
import type { CmcdSessionReporterConfig } from './CmcdSessionReporterConfig.ts'

/**
 * One CMCD session. It reports under one `sid` at a time and owns the targets, the requester, the timers, and `bg`.
 *
 * @public
 */
export type CmcdSession = {
	/** The current `sid`. */
	readonly sid: string
	createReporter(config?: CmcdSessionReporterConfig): CmcdSessionReporter
	/** Starts the next `sid` for every reporter. A new UUID when omitted. Emits nothing. */
	rotate(sid?: string): void
	/** Replaces the request-mode settings. Emits nothing and resets no counter. */
	configure(settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void
	/** Sends every queued event line now. */
	flush(): void
	dispose(): void
}
