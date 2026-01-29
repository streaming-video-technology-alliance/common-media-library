import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD object header name.
 *
 * @public
 */
export const CMCD_OBJECT = 'CMCD-Object' as const

/**
 * CMCD request header name.
 *
 * @public
 */
export const CMCD_REQUEST = 'CMCD-Request' as const

/**
 * CMCD session header name.
 *
 * @public
 */
export const CMCD_SESSION = 'CMCD-Session' as const

/**
 * CMCD status header name.
 *
 * @public
 */
export const CMCD_STATUS = 'CMCD-Status' as const

/**
 * CMCD header fields.
 *
 *
 * @enum
 *
 * @public
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
} as const

/**
 * @public
 */
export type CmcdHeaderField = ValueOf<typeof CmcdHeaderField>;
