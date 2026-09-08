import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 5 [Accessibility] 000: Unknown accessibility error
 *
 * @public
 */
export const SVTA_ACCESSIBILITY_UNKNOWN = 5000 as const

/**
 * SVTA 5 [Accessibility] 001: Unable to parse timed text
 *
 * @public
 */
export const SVTA_TIMED_TEXT_PARSE_ERROR = 5001 as const

/**
 * SVTA 5 [Accessibility] 002: Unable to render timed text
 *
 * @public
 */
export const SVTA_TIMED_TEXT_RENDER_ERROR = 5002 as const

/**
 * SVTA 5 [Accessibility] 003: Timed text exceeds content duration
 *
 * @public
 */
export const SVTA_TIMED_TEXT_EXCEEDS_CONTENT_DURATION = 5003 as const

/**
 * SVTA 5 [Accessibility] 004: Audio description exceeds content duration
 *
 * @public
 */
export const SVTA_AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION = 5004 as const

/**
 * SVTA standardized error codes in the Accessibility category (5xxx):
 * defective captions or audio description.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaAccessibilityErrorCode = {
	/**
	 * Unknown accessibility error
	 */
	UNKNOWN: SVTA_ACCESSIBILITY_UNKNOWN as typeof SVTA_ACCESSIBILITY_UNKNOWN,

	/**
	 * Unable to parse timed text
	 */
	TIMED_TEXT_PARSE_ERROR: SVTA_TIMED_TEXT_PARSE_ERROR as typeof SVTA_TIMED_TEXT_PARSE_ERROR,

	/**
	 * Unable to render timed text
	 */
	TIMED_TEXT_RENDER_ERROR: SVTA_TIMED_TEXT_RENDER_ERROR as typeof SVTA_TIMED_TEXT_RENDER_ERROR,

	/**
	 * Timed text exceeds content duration
	 */
	TIMED_TEXT_EXCEEDS_CONTENT_DURATION: SVTA_TIMED_TEXT_EXCEEDS_CONTENT_DURATION as typeof SVTA_TIMED_TEXT_EXCEEDS_CONTENT_DURATION,

	/**
	 * Audio description exceeds content duration
	 */
	AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION: SVTA_AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION as typeof SVTA_AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION,
} as const

/**
 * Union type of all {@link (SvtaAccessibilityErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaAccessibilityErrorCode = ValueOf<typeof SvtaAccessibilityErrorCode>
