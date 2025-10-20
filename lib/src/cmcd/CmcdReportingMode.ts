import type { ValueOf } from '../utils/ValueOf.js';
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.js';
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.js';

/**
 * CMCD reporting mode types.
 *
 * @group CMCD
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
	 * Event mode
	 */
	EVENT: CMCD_EVENT_MODE as typeof CMCD_EVENT_MODE,
} as const;

/**
 * @beta
 */
export type CmcdReportingMode = ValueOf<typeof CmcdReportingMode>;
