import type { ValueOf } from '../utils/ValueOf.js';
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
	REQUEST: 'request',
	/**
	 * Response mode
	 */
	RESPONSE: 'response',
	/**
	 * Event mode
	 */
	EVENT: 'event',
} as const;

/**
 * @beta
 */
export type CmcdMode = ValueOf<typeof CmcdMode>;
