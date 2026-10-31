import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'

/**
 * The request mode settings of a CMCD session. The type is
 * {@link CmcdRequestReportConfig} without `transform`.
 *
 * @public
 */
export type CmcdSessionRequestReportConfig = Omit<CmcdRequestReportConfig, 'transform'> & {
	/**
	 * Only `CmcdReporter` reads `transform`. A session configuration with a
	 * `transform` does not compile. The data of each call shapes the reports
	 * of a session.
	 */
	transform?: never
}
