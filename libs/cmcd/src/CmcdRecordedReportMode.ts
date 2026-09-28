import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD query reporting mode: CMCD data transmitted as a `CMCD=` URL
 * query parameter.
 *
 * @public
 */
export const CMCD_RECORDED_REPORT_MODE_QUERY = 'query' as const

/**
 * CMCD header reporting mode: CMCD data transmitted as `CMCD-*` HTTP
 * headers.
 *
 * @public
 */
export const CMCD_RECORDED_REPORT_MODE_HEADER = 'header' as const

/**
 * CMCD event reporting mode: CMCD data transmitted as a POST body to an
 * event-target URL.
 *
 * @public
 */
export const CMCD_RECORDED_REPORT_MODE_EVENT = 'event' as const

/**
 * Reporting mode in which `CmcdReportRecorder` observed a captured
 * report.
 *
 * @enum
 *
 * @public
 */
export const CmcdRecordedReportMode = {
	QUERY: CMCD_RECORDED_REPORT_MODE_QUERY as typeof CMCD_RECORDED_REPORT_MODE_QUERY,
	HEADER: CMCD_RECORDED_REPORT_MODE_HEADER as typeof CMCD_RECORDED_REPORT_MODE_HEADER,
	EVENT: CMCD_RECORDED_REPORT_MODE_EVENT as typeof CMCD_RECORDED_REPORT_MODE_EVENT,
} as const

/**
 * @public
 */
export type CmcdRecordedReportMode = ValueOf<typeof CmcdRecordedReportMode>
