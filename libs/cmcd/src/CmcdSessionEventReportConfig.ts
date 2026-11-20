import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdEventSender } from './CmcdEventSender.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'

/**
 * An event target of a CMCD session. The type is {@link CmcdEventReportConfig}
 * without `transform`, with `filter`. The target has a collector `url` or a
 * `send` function.
 *
 * @public
 */
export type CmcdSessionEventReportConfig = Omit<CmcdEventReportConfig, 'transform' | 'url'> & {
	/**
	 * Selects the reports that the target receives. Without a filter, the
	 * target receives every report of its events.
	 *
	 * @defaultValue `undefined`
	 */
	filter?: CmcdReportFilter

	/**
	 * Only `CmcdReporter` reads `transform`. A session target with a
	 * `transform` does not compile. Use `filter` to select the reports of
	 * the target.
	 */
	transform?: never
} & (
		| {
				/**
				 * The URL of the collector. The requester sends each batch as a POST.
				 */
				url: string

				/**
				 * A target with `url` has no `send`.
				 */
				send?: never
		  }
		| {
				/**
				 * A target with `send` has no `url`.
				 */
				url?: never

				/**
				 * Sends each batch. Use a function for a transport that is not HTTP.
				 */
				send: CmcdEventSender
		  }
	)
