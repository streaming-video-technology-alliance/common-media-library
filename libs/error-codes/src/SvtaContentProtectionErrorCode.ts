import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 4 [Content Protection] 000: Unknown content protection error
 *
 * @public
 */
export const SVTA_CONTENT_PROTECTION_UNKNOWN = 4000 as const

/**
 * SVTA 4 [Content Protection] 001: Concurrent stream limit exceeded
 *
 * @public
 */
export const SVTA_CONCURRENT_STREAM_LIMIT_EXCEEDED = 4001 as const

/**
 * SVTA 4 [Content Protection] 002: Entitlement refused
 *
 * @public
 */
export const SVTA_ENTITLEMENT_REFUSED = 4002 as const

/**
 * SVTA 4 [Content Protection] 003: License expired
 *
 * @public
 */
export const SVTA_LICENSE_EXPIRED = 4003 as const

/**
 * SVTA 4 [Content Protection] 004: Bad license request
 *
 * @public
 */
export const SVTA_BAD_LICENSE_REQUEST = 4004 as const

/**
 * SVTA 4 [Content Protection] 005: License server timeout
 *
 * @public
 */
export const SVTA_LICENSE_SERVER_TIMEOUT = 4005 as const

/**
 * SVTA 4 [Content Protection] 006: Insufficient DRM robustness level
 *
 * @public
 */
export const SVTA_INSUFFICIENT_DRM_ROBUSTNESS = 4006 as const

/**
 * SVTA 4 [Content Protection] 007: Insufficient output protection
 *
 * @public
 */
export const SVTA_INSUFFICIENT_OUTPUT_PROTECTION = 4007 as const

/**
 * SVTA 4 [Content Protection] 008: Unsupported or unavailable DRM system
 *
 * @public
 */
export const SVTA_UNSUPPORTED_DRM_SYSTEM = 4008 as const

/**
 * SVTA 4 [Content Protection] 009: Access restricted due to unsupported geo
 *
 * @public
 */
export const SVTA_GEO_RESTRICTED = 4009 as const

/**
 * SVTA 4 [Content Protection] 010: DRM initialization error
 *
 * @public
 */
export const SVTA_DRM_INITIALIZATION_ERROR = 4010 as const

/**
 * SVTA 4 [Content Protection] 011: CDN unauthorized
 *
 * @public
 */
export const SVTA_CDN_UNAUTHORIZED = 4011 as const

/**
 * SVTA 4 [Content Protection] 012: Invalid access token
 *
 * @public
 */
export const SVTA_INVALID_ACCESS_TOKEN = 4012 as const

/**
 * SVTA 4 [Content Protection] 013: DRM certificate error
 *
 * @public
 */
export const SVTA_DRM_CERTIFICATE_ERROR = 4013 as const

/**
 * SVTA 4 [Content Protection] 014: DRM session error
 *
 * @public
 */
export const SVTA_DRM_SESSION_ERROR = 4014 as const

/**
 * SVTA 4 [Content Protection] 015: DRM initialization data or configuration missing
 *
 * @public
 */
export const SVTA_DRM_CONFIGURATION_MISSING = 4015 as const

/**
 * SVTA 4 [Content Protection] 016: DRM license response rejected
 *
 * @public
 */
export const SVTA_LICENSE_RESPONSE_REJECTED = 4016 as const

/**
 * SVTA 4 [Content Protection] 017: Persistent session DRM error
 *
 * @public
 */
export const SVTA_PERSISTENT_SESSION_ERROR = 4017 as const

/**
 * SVTA 4 [Content Protection] 018: Required permission rejected
 *
 * @public
 */
export const SVTA_PERMISSION_REJECTED = 4018 as const

/**
 * SVTA 4 [Content Protection] 019: Failed to load decryption key
 *
 * @public
 */
export const SVTA_KEY_LOAD_ERROR = 4019 as const

/**
 * SVTA 4 [Content Protection] 020: Failed to decrypt segment
 *
 * @public
 */
export const SVTA_SEGMENT_DECRYPTION_ERROR = 4020 as const

/**
 * SVTA 4 [Content Protection] 021: Failed to generate DRM license request
 *
 * @public
 */
export const SVTA_LICENSE_REQUEST_GENERATION_ERROR = 4021 as const

/**
 * SVTA standardized error codes in the Content Protection category
 * (4xxx): security related errors, including authentication and
 * entitlement issues.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaContentProtectionErrorCode = {
	/**
	 * Unknown content protection error
	 */
	UNKNOWN: SVTA_CONTENT_PROTECTION_UNKNOWN as typeof SVTA_CONTENT_PROTECTION_UNKNOWN,

	/**
	 * Concurrent stream limit exceeded
	 */
	CONCURRENT_STREAM_LIMIT_EXCEEDED: SVTA_CONCURRENT_STREAM_LIMIT_EXCEEDED as typeof SVTA_CONCURRENT_STREAM_LIMIT_EXCEEDED,

	/**
	 * Entitlement refused
	 */
	ENTITLEMENT_REFUSED: SVTA_ENTITLEMENT_REFUSED as typeof SVTA_ENTITLEMENT_REFUSED,

	/**
	 * License expired
	 */
	LICENSE_EXPIRED: SVTA_LICENSE_EXPIRED as typeof SVTA_LICENSE_EXPIRED,

	/**
	 * Bad license request
	 */
	BAD_LICENSE_REQUEST: SVTA_BAD_LICENSE_REQUEST as typeof SVTA_BAD_LICENSE_REQUEST,

	/**
	 * License server timeout
	 */
	LICENSE_SERVER_TIMEOUT: SVTA_LICENSE_SERVER_TIMEOUT as typeof SVTA_LICENSE_SERVER_TIMEOUT,

	/**
	 * Insufficient DRM robustness level
	 */
	INSUFFICIENT_DRM_ROBUSTNESS: SVTA_INSUFFICIENT_DRM_ROBUSTNESS as typeof SVTA_INSUFFICIENT_DRM_ROBUSTNESS,

	/**
	 * Insufficient output protection
	 */
	INSUFFICIENT_OUTPUT_PROTECTION: SVTA_INSUFFICIENT_OUTPUT_PROTECTION as typeof SVTA_INSUFFICIENT_OUTPUT_PROTECTION,

	/**
	 * Unsupported or unavailable DRM system
	 */
	UNSUPPORTED_DRM_SYSTEM: SVTA_UNSUPPORTED_DRM_SYSTEM as typeof SVTA_UNSUPPORTED_DRM_SYSTEM,

	/**
	 * Access restricted due to unsupported geo
	 */
	GEO_RESTRICTED: SVTA_GEO_RESTRICTED as typeof SVTA_GEO_RESTRICTED,

	/**
	 * DRM initialization error
	 */
	DRM_INITIALIZATION_ERROR: SVTA_DRM_INITIALIZATION_ERROR as typeof SVTA_DRM_INITIALIZATION_ERROR,

	/**
	 * CDN unauthorized
	 */
	CDN_UNAUTHORIZED: SVTA_CDN_UNAUTHORIZED as typeof SVTA_CDN_UNAUTHORIZED,

	/**
	 * Invalid access token
	 */
	INVALID_ACCESS_TOKEN: SVTA_INVALID_ACCESS_TOKEN as typeof SVTA_INVALID_ACCESS_TOKEN,

	/**
	 * DRM certificate error
	 */
	DRM_CERTIFICATE_ERROR: SVTA_DRM_CERTIFICATE_ERROR as typeof SVTA_DRM_CERTIFICATE_ERROR,

	/**
	 * DRM session error
	 */
	DRM_SESSION_ERROR: SVTA_DRM_SESSION_ERROR as typeof SVTA_DRM_SESSION_ERROR,

	/**
	 * DRM initialization data or configuration missing
	 */
	DRM_CONFIGURATION_MISSING: SVTA_DRM_CONFIGURATION_MISSING as typeof SVTA_DRM_CONFIGURATION_MISSING,

	/**
	 * DRM license response rejected
	 */
	LICENSE_RESPONSE_REJECTED: SVTA_LICENSE_RESPONSE_REJECTED as typeof SVTA_LICENSE_RESPONSE_REJECTED,

	/**
	 * Persistent session DRM error
	 */
	PERSISTENT_SESSION_ERROR: SVTA_PERSISTENT_SESSION_ERROR as typeof SVTA_PERSISTENT_SESSION_ERROR,

	/**
	 * Required permission rejected
	 */
	PERMISSION_REJECTED: SVTA_PERMISSION_REJECTED as typeof SVTA_PERMISSION_REJECTED,

	/**
	 * Failed to load decryption key
	 */
	KEY_LOAD_ERROR: SVTA_KEY_LOAD_ERROR as typeof SVTA_KEY_LOAD_ERROR,

	/**
	 * Failed to decrypt segment
	 */
	SEGMENT_DECRYPTION_ERROR: SVTA_SEGMENT_DECRYPTION_ERROR as typeof SVTA_SEGMENT_DECRYPTION_ERROR,

	/**
	 * Failed to generate DRM license request
	 */
	LICENSE_REQUEST_GENERATION_ERROR: SVTA_LICENSE_REQUEST_GENERATION_ERROR as typeof SVTA_LICENSE_REQUEST_GENERATION_ERROR,
} as const

/**
 * Union type of all {@link (SvtaContentProtectionErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaContentProtectionErrorCode = ValueOf<typeof SvtaContentProtectionErrorCode>
