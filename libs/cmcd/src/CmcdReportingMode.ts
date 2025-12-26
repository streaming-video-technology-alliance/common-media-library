import type { ValueOf } from '@svta/cml-utils'
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.ts'
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.ts'

/**
 * CMCD reporting mode types.
 *
 *
 * @enum
 *
 * @public
 */
export const CmcdReportingMode = {
	/**
	 * Request mode
	 */
	REQUEST: CMCD_REQUEST_MODE as typeof CMCD_REQUEST_MODE,

	/**
	 * Event mode
	 */
	EVENT: CMCD_EVENT_MODE as typeof CMCD_EVENT_MODE,
} as const

/**
 * @public
 */
export type CmcdReportingMode = ValueOf<typeof CmcdReportingMode>;
