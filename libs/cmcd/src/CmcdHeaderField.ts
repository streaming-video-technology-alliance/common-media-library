import type { ValueOf } from '@svta/cml-utils';
import { CMCD_OBJECT } from './CMCD_OBJECT.ts';
import { CMCD_REQUEST } from './CMCD_REQUEST.ts';
import { CMCD_SESSION } from './CMCD_SESSION.ts';
import { CMCD_STATUS } from './CMCD_STATUS.ts';

/**
 * CMCD header fields.
 *
 *
 * @enum
 *
 * @beta
 */
export const CmcdHeaderField = {
	/**
	 * keys whose values vary with the object being requested.
	 */
	OBJECT: CMCD_OBJECT as typeof CMCD_OBJECT,

	/**
	 * keys whose values vary with each request.
	 */
	REQUEST: CMCD_REQUEST as typeof CMCD_REQUEST,

	/**
	 * keys whose values are expected to be invariant over the life of the session.
	 */
	SESSION: CMCD_SESSION as typeof CMCD_SESSION,

	/**
	 * keys whose values do not vary with every request or object.
	 */
	STATUS: CMCD_STATUS as typeof CMCD_STATUS,
} as const;

/**
 * @beta
 */
export type CmcdHeaderField = ValueOf<typeof CmcdHeaderField>;
