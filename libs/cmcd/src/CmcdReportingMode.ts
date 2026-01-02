import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD event mode variable name.
 *
 * @public
 */
export const CMCD_EVENT_MODE = 'event' as const

/**
 * CMCD request mode variable name.
 *
 * @public
 */
export const CMCD_REQUEST_MODE = 'request' as const

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
