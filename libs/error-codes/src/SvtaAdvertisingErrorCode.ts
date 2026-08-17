import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 7 [Advertising] 000: Unknown advertising error
 *
 * @public
 */
export const SVTA_ADVERTISING_UNKNOWN = 7000 as const

/**
 * SVTA 7 [Advertising] 001: Ad blocker detected
 *
 * @public
 */
export const SVTA_AD_BLOCKER_DETECTED = 7001 as const

/**
 * SVTA 7 [Advertising] 100: Unable to parse VAST XML
 *
 * @public
 */
export const SVTA_VAST_PARSE_ERROR = 7100 as const

/**
 * SVTA 7 [Advertising] 101: Invalid VAST schema
 *
 * @public
 */
export const SVTA_VAST_SCHEMA_VALIDATION_ERROR = 7101 as const

/**
 * SVTA 7 [Advertising] 102: VAST response version not supported
 *
 * @public
 */
export const SVTA_VAST_VERSION_UNSUPPORTED = 7102 as const

/**
 * SVTA 7 [Advertising] 200: Video player expected different ad type
 *
 * @public
 */
export const SVTA_AD_TYPE_MISMATCH = 7200 as const

/**
 * SVTA 7 [Advertising] 201: Creative has different linearity than player expected (non-fatal)
 *
 * @public
 */
export const SVTA_LINEARITY_MISMATCH = 7201 as const

/**
 * SVTA 7 [Advertising] 202: Creative has different duration than player expected (non-fatal)
 *
 * @public
 */
export const SVTA_DURATION_MISMATCH = 7202 as const

/**
 * SVTA 7 [Advertising] 203: Creative has different size than player expected (non-fatal)
 *
 * @public
 */
export const SVTA_SIZE_MISMATCH = 7203 as const

/**
 * SVTA 7 [Advertising] 300: Wrapper failed to deliver VAST response for unknown reason
 *
 * @public
 */
export const SVTA_WRAPPER_ERROR = 7300 as const

/**
 * SVTA 7 [Advertising] 301: VAST response redirect timed out
 *
 * @public
 */
export const SVTA_WRAPPER_TIMEOUT = 7301 as const

/**
 * SVTA 7 [Advertising] 302: Wrapper limit reached (e.g. too many redirects)
 *
 * @public
 */
export const SVTA_WRAPPER_LIMIT_REACHED = 7302 as const

/**
 * SVTA 7 [Advertising] 303: VAST response was empty
 *
 * @public
 */
export const SVTA_EMPTY_WRAPPER_RESPONSE = 7303 as const

/**
 * SVTA 7 [Advertising] 400: Unable to display linear ad
 *
 * @public
 */
export const SVTA_LINEAR_AD_ERROR = 7400 as const

/**
 * SVTA 7 [Advertising] 401: Media file not found
 *
 * @public
 */
export const SVTA_MEDIA_FILE_NOT_FOUND = 7401 as const

/**
 * SVTA 7 [Advertising] 402: Media file unavailable
 *
 * @public
 */
export const SVTA_MEDIA_FILE_UNAVAILABLE = 7402 as const

/**
 * SVTA 7 [Advertising] 403: VAST response contained no supported MIME types
 *
 * @public
 */
export const SVTA_NO_SUPPORTED_MEDIA_TYPE = 7403 as const

/**
 * SVTA 7 [Advertising] 405: Unable to display media file
 *
 * @public
 */
export const SVTA_MEDIA_FILE_DISPLAY_ERROR = 7405 as const

/**
 * SVTA 7 [Advertising] 406: Required mezzanine file missing
 *
 * @public
 */
export const SVTA_MEZZANINE_MISSING = 7406 as const

/**
 * SVTA 7 [Advertising] 407: Mezzanine file was downloaded for the first time
 *
 * @public
 */
export const SVTA_MEZZANINE_DOWNLOADING = 7407 as const

/**
 * SVTA 7 [Advertising] 408: VAST response contained rejected ad
 *
 * @public
 */
export const SVTA_REJECTED_AD = 7408 as const

/**
 * SVTA 7 [Advertising] 409: Could not execute creative defined in interactiveCreativeFile
 *
 * @public
 */
export const SVTA_INTERACTIVE_CREATIVE_ERROR = 7409 as const

/**
 * SVTA 7 [Advertising] 410: Could not execute code in verification node
 *
 * @public
 */
export const SVTA_VERIFICATION_ERROR = 7410 as const

/**
 * SVTA 7 [Advertising] 500: Video player unable to display non-linear ad for unknown reason
 *
 * @public
 */
export const SVTA_NONLINEAR_AD_ERROR = 7500 as const

/**
 * SVTA 7 [Advertising] 501: Non-linear ad dimensions did not match display area
 *
 * @public
 */
export const SVTA_NONLINEAR_DIMENSION_MISMATCH = 7501 as const

/**
 * SVTA 7 [Advertising] 502: Unable to fetch non-linear ad resource
 *
 * @public
 */
export const SVTA_NONLINEAR_AD_FETCH_ERROR = 7502 as const

/**
 * SVTA 7 [Advertising] 503: Non-linear ad did not contain a supported type
 *
 * @public
 */
export const SVTA_UNSUPPORTED_NONLINEAR_AD = 7503 as const

/**
 * SVTA 7 [Advertising] 600: Could not display companion ad (non-fatal)
 *
 * @public
 */
export const SVTA_COMPANION_AD_ERROR = 7600 as const

/**
 * SVTA 7 [Advertising] 601: Companion ad dimensions did not match display area
 *
 * @public
 */
export const SVTA_COMPANION_DIMENSION_MISMATCH = 7601 as const

/**
 * SVTA 7 [Advertising] 602: Unable to display required companion ad
 *
 * @public
 */
export const SVTA_REQUIRED_COMPANION_AD_ERROR = 7602 as const

/**
 * SVTA 7 [Advertising] 603: Unable to fetch companion ad resource
 *
 * @public
 */
export const SVTA_COMPANION_AD_FETCH_ERROR = 7603 as const

/**
 * SVTA 7 [Advertising] 900: Undefined VAST error
 *
 * @public
 */
export const SVTA_UNDEFINED_VAST_ERROR = 7900 as const

/**
 * SVTA 7 [Advertising] 901: Unknown VPAID error
 *
 * @public
 */
export const SVTA_VPAID_ERROR = 7901 as const

/**
 * SVTA 7 [Advertising] 999: VAST response document was empty
 *
 * @public
 */
export const SVTA_EMPTY_VAST_RESPONSE = 7999 as const

/**
 * SVTA standardized error codes in the Advertising category (7xxx):
 * issues triggered by ad insertion.
 *
 * IAB VAST error codes embed into this category at indices 100 through
 * 999 (e.g. `7301` is VAST error 301); see `vastErrorToSvtaErrorCode`.
 * VAST defines no error 404, so there is no `7404`.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 * @see {@link https://www.iab.com/wp-content/uploads/2016/01/VAST_4-0_2016-01-21.pdf | IAB VAST 4.0 §2.3.6.3 Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaAdvertisingErrorCode = {
	/**
	 * Unknown advertising error
	 */
	UNKNOWN: SVTA_ADVERTISING_UNKNOWN as typeof SVTA_ADVERTISING_UNKNOWN,

	/**
	 * Ad blocker detected
	 */
	AD_BLOCKER_DETECTED: SVTA_AD_BLOCKER_DETECTED as typeof SVTA_AD_BLOCKER_DETECTED,

	/**
	 * Unable to parse VAST XML
	 */
	VAST_PARSE_ERROR: SVTA_VAST_PARSE_ERROR as typeof SVTA_VAST_PARSE_ERROR,

	/**
	 * Invalid VAST schema
	 */
	VAST_SCHEMA_VALIDATION_ERROR: SVTA_VAST_SCHEMA_VALIDATION_ERROR as typeof SVTA_VAST_SCHEMA_VALIDATION_ERROR,

	/**
	 * VAST response version not supported
	 */
	VAST_VERSION_UNSUPPORTED: SVTA_VAST_VERSION_UNSUPPORTED as typeof SVTA_VAST_VERSION_UNSUPPORTED,

	/**
	 * Video player expected different ad type
	 */
	AD_TYPE_MISMATCH: SVTA_AD_TYPE_MISMATCH as typeof SVTA_AD_TYPE_MISMATCH,

	/**
	 * Creative has different linearity than player expected (non-fatal)
	 */
	LINEARITY_MISMATCH: SVTA_LINEARITY_MISMATCH as typeof SVTA_LINEARITY_MISMATCH,

	/**
	 * Creative has different duration than player expected (non-fatal)
	 */
	DURATION_MISMATCH: SVTA_DURATION_MISMATCH as typeof SVTA_DURATION_MISMATCH,

	/**
	 * Creative has different size than player expected (non-fatal)
	 */
	SIZE_MISMATCH: SVTA_SIZE_MISMATCH as typeof SVTA_SIZE_MISMATCH,

	/**
	 * Wrapper failed to deliver VAST response for unknown reason
	 */
	WRAPPER_ERROR: SVTA_WRAPPER_ERROR as typeof SVTA_WRAPPER_ERROR,

	/**
	 * VAST response redirect timed out
	 */
	WRAPPER_TIMEOUT: SVTA_WRAPPER_TIMEOUT as typeof SVTA_WRAPPER_TIMEOUT,

	/**
	 * Wrapper limit reached (e.g. too many redirects)
	 */
	WRAPPER_LIMIT_REACHED: SVTA_WRAPPER_LIMIT_REACHED as typeof SVTA_WRAPPER_LIMIT_REACHED,

	/**
	 * VAST response was empty
	 */
	EMPTY_WRAPPER_RESPONSE: SVTA_EMPTY_WRAPPER_RESPONSE as typeof SVTA_EMPTY_WRAPPER_RESPONSE,

	/**
	 * Unable to display linear ad
	 */
	LINEAR_AD_ERROR: SVTA_LINEAR_AD_ERROR as typeof SVTA_LINEAR_AD_ERROR,

	/**
	 * Media file not found
	 */
	MEDIA_FILE_NOT_FOUND: SVTA_MEDIA_FILE_NOT_FOUND as typeof SVTA_MEDIA_FILE_NOT_FOUND,

	/**
	 * Media file unavailable
	 */
	MEDIA_FILE_UNAVAILABLE: SVTA_MEDIA_FILE_UNAVAILABLE as typeof SVTA_MEDIA_FILE_UNAVAILABLE,

	/**
	 * VAST response contained no supported MIME types
	 */
	NO_SUPPORTED_MEDIA_TYPE: SVTA_NO_SUPPORTED_MEDIA_TYPE as typeof SVTA_NO_SUPPORTED_MEDIA_TYPE,

	/**
	 * Unable to display media file
	 */
	MEDIA_FILE_DISPLAY_ERROR: SVTA_MEDIA_FILE_DISPLAY_ERROR as typeof SVTA_MEDIA_FILE_DISPLAY_ERROR,

	/**
	 * Required mezzanine file missing
	 */
	MEZZANINE_MISSING: SVTA_MEZZANINE_MISSING as typeof SVTA_MEZZANINE_MISSING,

	/**
	 * Mezzanine file was downloaded for the first time
	 */
	MEZZANINE_DOWNLOADING: SVTA_MEZZANINE_DOWNLOADING as typeof SVTA_MEZZANINE_DOWNLOADING,

	/**
	 * VAST response contained rejected ad
	 */
	REJECTED_AD: SVTA_REJECTED_AD as typeof SVTA_REJECTED_AD,

	/**
	 * Could not execute creative defined in interactiveCreativeFile
	 */
	INTERACTIVE_CREATIVE_ERROR: SVTA_INTERACTIVE_CREATIVE_ERROR as typeof SVTA_INTERACTIVE_CREATIVE_ERROR,

	/**
	 * Could not execute code in verification node
	 */
	VERIFICATION_ERROR: SVTA_VERIFICATION_ERROR as typeof SVTA_VERIFICATION_ERROR,

	/**
	 * Video player unable to display non-linear ad for unknown reason
	 */
	NONLINEAR_AD_ERROR: SVTA_NONLINEAR_AD_ERROR as typeof SVTA_NONLINEAR_AD_ERROR,

	/**
	 * Non-linear ad dimensions did not match display area
	 */
	NONLINEAR_DIMENSION_MISMATCH: SVTA_NONLINEAR_DIMENSION_MISMATCH as typeof SVTA_NONLINEAR_DIMENSION_MISMATCH,

	/**
	 * Unable to fetch non-linear ad resource
	 */
	NONLINEAR_AD_FETCH_ERROR: SVTA_NONLINEAR_AD_FETCH_ERROR as typeof SVTA_NONLINEAR_AD_FETCH_ERROR,

	/**
	 * Non-linear ad did not contain a supported type
	 */
	UNSUPPORTED_NONLINEAR_AD: SVTA_UNSUPPORTED_NONLINEAR_AD as typeof SVTA_UNSUPPORTED_NONLINEAR_AD,

	/**
	 * Could not display companion ad (non-fatal)
	 */
	COMPANION_AD_ERROR: SVTA_COMPANION_AD_ERROR as typeof SVTA_COMPANION_AD_ERROR,

	/**
	 * Companion ad dimensions did not match display area
	 */
	COMPANION_DIMENSION_MISMATCH: SVTA_COMPANION_DIMENSION_MISMATCH as typeof SVTA_COMPANION_DIMENSION_MISMATCH,

	/**
	 * Unable to display required companion ad
	 */
	REQUIRED_COMPANION_AD_ERROR: SVTA_REQUIRED_COMPANION_AD_ERROR as typeof SVTA_REQUIRED_COMPANION_AD_ERROR,

	/**
	 * Unable to fetch companion ad resource
	 */
	COMPANION_AD_FETCH_ERROR: SVTA_COMPANION_AD_FETCH_ERROR as typeof SVTA_COMPANION_AD_FETCH_ERROR,

	/**
	 * Undefined VAST error
	 */
	UNDEFINED_VAST_ERROR: SVTA_UNDEFINED_VAST_ERROR as typeof SVTA_UNDEFINED_VAST_ERROR,

	/**
	 * Unknown VPAID error
	 */
	VPAID_ERROR: SVTA_VPAID_ERROR as typeof SVTA_VPAID_ERROR,

	/**
	 * VAST response document was empty
	 */
	EMPTY_VAST_RESPONSE: SVTA_EMPTY_VAST_RESPONSE as typeof SVTA_EMPTY_VAST_RESPONSE,
} as const

/**
 * Union type of all {@link (SvtaAdvertisingErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaAdvertisingErrorCode = ValueOf<typeof SvtaAdvertisingErrorCode>
