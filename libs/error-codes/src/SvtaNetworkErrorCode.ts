import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 3 [Network] 000: Unknown network error
 *
 * @public
 */
export const SVTA_NETWORK_UNKNOWN = 3000 as const

/**
 * SVTA 3 [Network] 001: No network connection
 *
 * @public
 */
export const SVTA_NO_NETWORK_CONNECTION = 3001 as const

/**
 * SVTA 3 [Network] 002: HTTP timeout
 *
 * @public
 */
export const SVTA_HTTP_TIMEOUT = 3002 as const

/**
 * SVTA 3 [Network] 003: Unable to resolve host
 *
 * @public
 */
export const SVTA_HOST_RESOLUTION_ERROR = 3003 as const

/**
 * SVTA 3 [Network] 004: Resource not found
 *
 * @public
 */
export const SVTA_RESOURCE_NOT_FOUND = 3004 as const

/**
 * SVTA 3 [Network] 005: Invalid URI
 *
 * @public
 */
export const SVTA_INVALID_URI = 3005 as const

/**
 * SVTA 3 [Network] 006: Unsupported URI scheme
 *
 * @public
 */
export const SVTA_UNSUPPORTED_URI_SCHEME = 3006 as const

/**
 * SVTA 3 [Network] 007: Download error
 *
 * @public
 */
export const SVTA_DOWNLOAD_ERROR = 3007 as const

/**
 * SVTA 3 [Network] 008: Max retries have been exceeded
 *
 * @public
 */
export const SVTA_MAX_RETRIES_EXCEEDED = 3008 as const

/**
 * SVTA 3 [Network] 009: Insufficient bandwidth to support playback of current presentation
 *
 * @public
 */
export const SVTA_INSUFFICIENT_BANDWIDTH = 3009 as const

/**
 * SVTA 3 [Network] 010: Resource denied
 *
 * @public
 */
export const SVTA_RESOURCE_DENIED = 3010 as const

/**
 * SVTA 3 [Network] 011: Invalid HTTP content type value
 *
 * @public
 */
export const SVTA_INVALID_HTTP_CONTENT_TYPE = 3011 as const

/**
 * SVTA standardized error codes in the Network category (3xxx): issues
 * on the network, including unavailable resources.
 *
 * HTTP response status codes embed into this category at indices 100
 * through 599 (e.g. `3404` is an HTTP 404 response); see
 * `httpStatusToSvtaErrorCode`.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaNetworkErrorCode = {
	/**
	 * Unknown network error
	 */
	UNKNOWN: SVTA_NETWORK_UNKNOWN as typeof SVTA_NETWORK_UNKNOWN,

	/**
	 * No network connection
	 */
	NO_NETWORK_CONNECTION: SVTA_NO_NETWORK_CONNECTION as typeof SVTA_NO_NETWORK_CONNECTION,

	/**
	 * HTTP timeout
	 */
	HTTP_TIMEOUT: SVTA_HTTP_TIMEOUT as typeof SVTA_HTTP_TIMEOUT,

	/**
	 * Unable to resolve host
	 */
	HOST_RESOLUTION_ERROR: SVTA_HOST_RESOLUTION_ERROR as typeof SVTA_HOST_RESOLUTION_ERROR,

	/**
	 * Resource not found
	 */
	RESOURCE_NOT_FOUND: SVTA_RESOURCE_NOT_FOUND as typeof SVTA_RESOURCE_NOT_FOUND,

	/**
	 * Invalid URI
	 */
	INVALID_URI: SVTA_INVALID_URI as typeof SVTA_INVALID_URI,

	/**
	 * Unsupported URI scheme
	 */
	UNSUPPORTED_URI_SCHEME: SVTA_UNSUPPORTED_URI_SCHEME as typeof SVTA_UNSUPPORTED_URI_SCHEME,

	/**
	 * Download error
	 */
	DOWNLOAD_ERROR: SVTA_DOWNLOAD_ERROR as typeof SVTA_DOWNLOAD_ERROR,

	/**
	 * Max retries have been exceeded
	 */
	MAX_RETRIES_EXCEEDED: SVTA_MAX_RETRIES_EXCEEDED as typeof SVTA_MAX_RETRIES_EXCEEDED,

	/**
	 * Insufficient bandwidth to support playback of current presentation
	 */
	INSUFFICIENT_BANDWIDTH: SVTA_INSUFFICIENT_BANDWIDTH as typeof SVTA_INSUFFICIENT_BANDWIDTH,

	/**
	 * Resource denied
	 */
	RESOURCE_DENIED: SVTA_RESOURCE_DENIED as typeof SVTA_RESOURCE_DENIED,

	/**
	 * Invalid HTTP content type value
	 */
	INVALID_HTTP_CONTENT_TYPE: SVTA_INVALID_HTTP_CONTENT_TYPE as typeof SVTA_INVALID_HTTP_CONTENT_TYPE,
} as const

/**
 * Union type of all {@link (SvtaNetworkErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaNetworkErrorCode = ValueOf<typeof SvtaNetworkErrorCode>
