import type { ValueOf } from '@svta/cml-utils';
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.ts';
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.ts';
import { CMCD_RESPONSE_MODE } from './CMCD_RESPONSE_MODE.ts';

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
