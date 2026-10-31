import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdReportFilter } from './CmcdReportFilter.ts'

/**
 * An event target of a CMCD session. The type is {@link CmcdEventReportConfig}
 * without `transform`, with `filter`.
 *
 * @public
 */
export type CmcdSessionEventReportConfig = Omit<CmcdEventReportConfig, 'transform'> & {
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
}
