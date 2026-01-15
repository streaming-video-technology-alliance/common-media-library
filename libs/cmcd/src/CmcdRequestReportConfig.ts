import type { CmcdReportConfig } from './CmcdReportConfig.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'

/**
 * Configuration for a CMCD request report.
 *
 * @public
 */
export type CmcdRequestReportConfig = CmcdReportConfig & {
	/**
	 * The transmission mode to use.
	 *
	 * @defaultValue `CmcdTransmissionMode.QUERY`
	 */
	transmissionMode?: CmcdTransmissionMode;
}
