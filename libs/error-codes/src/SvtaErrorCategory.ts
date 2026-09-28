import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA error category 0: Unknown error
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_UNKNOWN = 0 as const

/**
 * SVTA error category 1: Issues with the content itself, such as an unsupported format
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_MEDIA_CONTENT = 1 as const

/**
 * SVTA error category 2: Player unable to sustain the experience
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_PLAYBACK = 2 as const

/**
 * SVTA error category 3: Issues on the network, including unavailable resources
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_NETWORK = 3 as const

/**
 * SVTA error category 4: Security related error, including authentication or entitlement issues
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_CONTENT_PROTECTION = 4 as const

/**
 * SVTA error category 5: Defective captions or audio description
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_ACCESSIBILITY = 5 as const

/**
 * SVTA error category 6: Framework supporting the play out of the stream on a second device
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_REMOTE_PLAY = 6 as const

/**
 * SVTA error category 7: Issues triggered by ad insertion
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_ADVERTISING = 7 as const

/**
 * SVTA error category 99: Reserved category for Publisher-defined errors
 *
 * @public
 */
export const SVTA_ERROR_CATEGORY_CUSTOM = 99 as const

/**
 * SVTA standardized error code categories. The category of an error code
 * occupies its thousands digits: `Math.floor(code / 1000)` yields the
 * category of any SVTA error code.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaErrorCategory = {
	/**
	 * Unknown error
	 */
	UNKNOWN: SVTA_ERROR_CATEGORY_UNKNOWN as typeof SVTA_ERROR_CATEGORY_UNKNOWN,

	/**
	 * Issues with the content itself, such as an unsupported format
	 */
	MEDIA_CONTENT: SVTA_ERROR_CATEGORY_MEDIA_CONTENT as typeof SVTA_ERROR_CATEGORY_MEDIA_CONTENT,

	/**
	 * Player unable to sustain the experience
	 */
	PLAYBACK: SVTA_ERROR_CATEGORY_PLAYBACK as typeof SVTA_ERROR_CATEGORY_PLAYBACK,

	/**
	 * Issues on the network, including unavailable resources
	 */
	NETWORK: SVTA_ERROR_CATEGORY_NETWORK as typeof SVTA_ERROR_CATEGORY_NETWORK,

	/**
	 * Security related error, including authentication or entitlement issues
	 */
	CONTENT_PROTECTION: SVTA_ERROR_CATEGORY_CONTENT_PROTECTION as typeof SVTA_ERROR_CATEGORY_CONTENT_PROTECTION,

	/**
	 * Defective captions or audio description
	 */
	ACCESSIBILITY: SVTA_ERROR_CATEGORY_ACCESSIBILITY as typeof SVTA_ERROR_CATEGORY_ACCESSIBILITY,

	/**
	 * Framework supporting the play out of the stream on a second device
	 */
	REMOTE_PLAY: SVTA_ERROR_CATEGORY_REMOTE_PLAY as typeof SVTA_ERROR_CATEGORY_REMOTE_PLAY,

	/**
	 * Issues triggered by ad insertion
	 */
	ADVERTISING: SVTA_ERROR_CATEGORY_ADVERTISING as typeof SVTA_ERROR_CATEGORY_ADVERTISING,

	/**
	 * Reserved category for Publisher-defined errors
	 */
	CUSTOM: SVTA_ERROR_CATEGORY_CUSTOM as typeof SVTA_ERROR_CATEGORY_CUSTOM,
} as const

/**
 * Union type of all {@link (SvtaErrorCategory:variable)} values.
 *
 * @public
 */
export type SvtaErrorCategory = ValueOf<typeof SvtaErrorCategory>
