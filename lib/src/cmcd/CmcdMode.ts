import type { ValueOf } from '../utils/ValueOf.js';
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.js';
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.js';
import { CMCD_RESPONSE_MODE } from './CMCD_RESPONSE_MODE.js';

/**
 * CMCD mode types.
 *
 * @group CMCD
 *
 * @enum
 *
 * @beta
 */
export const CmcdMode  = {
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
export type CmcdMode = ValueOf<typeof CmcdMode>;
