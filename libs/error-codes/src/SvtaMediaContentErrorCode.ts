import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 1 [Media Content] 000: Unknown media content error
 *
 * @public
 */
export const SVTA_MEDIA_CONTENT_UNKNOWN = 1000 as const

/**
 * SVTA 1 [Media Content] 001: Media unavailable
 *
 * @public
 */
export const SVTA_MEDIA_UNAVAILABLE = 1001 as const

/**
 * SVTA 1 [Media Content] 002: Invalid manifest
 *
 * @public
 */
export const SVTA_INVALID_MANIFEST = 1002 as const

/**
 * SVTA 1 [Media Content] 003: Track not available
 *
 * @public
 */
export const SVTA_TRACK_NOT_AVAILABLE = 1003 as const

/**
 * SVTA 1 [Media Content] 004: Unsupported video format
 *
 * @public
 */
export const SVTA_UNSUPPORTED_VIDEO_FORMAT = 1004 as const

/**
 * SVTA 1 [Media Content] 005: Unsupported audio format
 *
 * @public
 */
export const SVTA_UNSUPPORTED_AUDIO_FORMAT = 1005 as const

/**
 * SVTA 1 [Media Content] 006: Unsupported text format
 *
 * @public
 */
export const SVTA_UNSUPPORTED_TEXT_FORMAT = 1006 as const

/**
 * SVTA 1 [Media Content] 007: Invalid composition track segment time
 *
 * @public
 */
export const SVTA_INVALID_COMPOSITION_TRACK_SEGMENT_TIME = 1007 as const

/**
 * SVTA 1 [Media Content] 008: Segment exceeds specified bitrate for track
 *
 * @public
 */
export const SVTA_SEGMENT_EXCEEDS_TRACK_BITRATE = 1008 as const

/**
 * SVTA 1 [Media Content] 009: Misaligned track duration
 *
 * @public
 */
export const SVTA_MISALIGNED_TRACK_DURATION = 1009 as const

/**
 * SVTA standardized error codes in the Media Content category (1xxx):
 * issues with the content itself.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaMediaContentErrorCode = {
	/**
	 * Unknown media content error
	 */
	UNKNOWN: SVTA_MEDIA_CONTENT_UNKNOWN as typeof SVTA_MEDIA_CONTENT_UNKNOWN,

	/**
	 * Media unavailable
	 */
	MEDIA_UNAVAILABLE: SVTA_MEDIA_UNAVAILABLE as typeof SVTA_MEDIA_UNAVAILABLE,

	/**
	 * Invalid manifest
	 */
	INVALID_MANIFEST: SVTA_INVALID_MANIFEST as typeof SVTA_INVALID_MANIFEST,

	/**
	 * Track not available
	 */
	TRACK_NOT_AVAILABLE: SVTA_TRACK_NOT_AVAILABLE as typeof SVTA_TRACK_NOT_AVAILABLE,

	/**
	 * Unsupported video format
	 */
	UNSUPPORTED_VIDEO_FORMAT: SVTA_UNSUPPORTED_VIDEO_FORMAT as typeof SVTA_UNSUPPORTED_VIDEO_FORMAT,

	/**
	 * Unsupported audio format
	 */
	UNSUPPORTED_AUDIO_FORMAT: SVTA_UNSUPPORTED_AUDIO_FORMAT as typeof SVTA_UNSUPPORTED_AUDIO_FORMAT,

	/**
	 * Unsupported text format
	 */
	UNSUPPORTED_TEXT_FORMAT: SVTA_UNSUPPORTED_TEXT_FORMAT as typeof SVTA_UNSUPPORTED_TEXT_FORMAT,

	/**
	 * Invalid composition track segment time
	 */
	INVALID_COMPOSITION_TRACK_SEGMENT_TIME: SVTA_INVALID_COMPOSITION_TRACK_SEGMENT_TIME as typeof SVTA_INVALID_COMPOSITION_TRACK_SEGMENT_TIME,

	/**
	 * Segment exceeds specified bitrate for track
	 */
	SEGMENT_EXCEEDS_TRACK_BITRATE: SVTA_SEGMENT_EXCEEDS_TRACK_BITRATE as typeof SVTA_SEGMENT_EXCEEDS_TRACK_BITRATE,

	/**
	 * Misaligned track duration
	 */
	MISALIGNED_TRACK_DURATION: SVTA_MISALIGNED_TRACK_DURATION as typeof SVTA_MISALIGNED_TRACK_DURATION,
} as const

/**
 * Union type of all {@link (SvtaMediaContentErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaMediaContentErrorCode = ValueOf<typeof SvtaMediaContentErrorCode>
