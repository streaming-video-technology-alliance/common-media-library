import type { ValueOf } from '@svta/cml-utils/ValueOf.js';
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.js';
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.js';
import { CMCD_RESPONSE_MODE } from './CMCD_RESPONSE_MODE.js';

/**
 * CMCD reporting mode types.
 *
 *
 * @enum
 *
 * @beta
 */
export const CmcdReportingMode = {
	/**
	 * Request mode
	 */
	REQUEST: CMCD_REQUEST_MODE as typeof CMCD_REQUEST_MODE,

	/**
	 * Response mode
	 */
	RESPONSE: CMCD_RESPONSE_MODE as typeof CMCD_RESPONSE_MODE,

	/**
	 * Event mode
	 */
	EVENT: CMCD_EVENT_MODE as typeof CMCD_EVENT_MODE,
} as const;

/**
 * @beta
 */
export type CmcdReportingMode = ValueOf<typeof CmcdReportingMode>;
