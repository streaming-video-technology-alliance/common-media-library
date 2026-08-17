import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA 2 [Playback] 000: Unknown playback error
 *
 * @public
 */
export const SVTA_PLAYBACK_UNKNOWN = 2000 as const

/**
 * SVTA 2 [Playback] 001: Video buffer underrun
 *
 * @public
 */
export const SVTA_VIDEO_BUFFER_UNDERRUN = 2001 as const

/**
 * SVTA 2 [Playback] 002: Audio buffer underrun
 *
 * @public
 */
export const SVTA_AUDIO_BUFFER_UNDERRUN = 2002 as const

/**
 * SVTA 2 [Playback] 003: Video buffering timeout
 *
 * @public
 */
export const SVTA_VIDEO_BUFFERING_TIMEOUT = 2003 as const

/**
 * SVTA 2 [Playback] 004: Audio buffering timeout
 *
 * @public
 */
export const SVTA_AUDIO_BUFFERING_TIMEOUT = 2004 as const

/**
 * SVTA 2 [Playback] 005: Unable to parse manifest
 *
 * @public
 */
export const SVTA_MANIFEST_PARSE_ERROR = 2005 as const

/**
 * SVTA 2 [Playback] 006: Segment parse error
 *
 * @public
 */
export const SVTA_SEGMENT_PARSE_ERROR = 2006 as const

/**
 * SVTA 2 [Playback] 007: Unable to decode video
 *
 * @public
 */
export const SVTA_VIDEO_DECODE_ERROR = 2007 as const

/**
 * SVTA 2 [Playback] 008: Unable to decode audio
 *
 * @public
 */
export const SVTA_AUDIO_DECODE_ERROR = 2008 as const

/**
 * SVTA 2 [Playback] 009: Video dropped frame count exceeds threshold
 *
 * @public
 */
export const SVTA_VIDEO_DROPPED_FRAMES_EXCEEDED = 2009 as const

/**
 * SVTA 2 [Playback] 010: Playhead exceeds content duration
 *
 * @public
 */
export const SVTA_PLAYHEAD_EXCEEDS_CONTENT_DURATION = 2010 as const

/**
 * SVTA 2 [Playback] 011: No supported video track
 *
 * @public
 */
export const SVTA_NO_SUPPORTED_VIDEO_TRACK = 2011 as const

/**
 * SVTA 2 [Playback] 012: No supported audio track
 *
 * @public
 */
export const SVTA_NO_SUPPORTED_AUDIO_TRACK = 2012 as const

/**
 * SVTA 2 [Playback] 013: No matching codec / profile / level
 *
 * @public
 */
export const SVTA_NO_MATCHING_CODEC = 2013 as const

/**
 * SVTA 2 [Playback] 014: Primary manifest load error
 *
 * @public
 */
export const SVTA_PRIMARY_MANIFEST_LOAD_ERROR = 2014 as const

/**
 * SVTA 2 [Playback] 015: Primary manifest load timeout
 *
 * @public
 */
export const SVTA_PRIMARY_MANIFEST_LOAD_TIMEOUT = 2015 as const

/**
 * SVTA 2 [Playback] 016: Unable to parse track from manifest
 *
 * @public
 */
export const SVTA_MANIFEST_TRACK_PARSE_ERROR = 2016 as const

/**
 * SVTA 2 [Playback] 017: Secondary manifest / asset list load error
 *
 * @public
 */
export const SVTA_SECONDARY_MANIFEST_LOAD_ERROR = 2017 as const

/**
 * SVTA 2 [Playback] 018: Unable to parse secondary manifest / asset list
 *
 * @public
 */
export const SVTA_SECONDARY_MANIFEST_PARSE_ERROR = 2018 as const

/**
 * SVTA 2 [Playback] 019: Unable to switch tracks
 *
 * @public
 */
export const SVTA_TRACK_SWITCH_ERROR = 2019 as const

/**
 * SVTA 2 [Playback] 020: Track load error
 *
 * @public
 */
export const SVTA_TRACK_LOAD_ERROR = 2020 as const

/**
 * SVTA 2 [Playback] 021: Remux issue
 *
 * @public
 */
export const SVTA_REMUX_ERROR = 2021 as const

/**
 * SVTA 2 [Playback] 022: Buffer initialization error
 *
 * @public
 */
export const SVTA_BUFFER_INITIALIZATION_ERROR = 2022 as const

/**
 * SVTA 2 [Playback] 023: Buffer append error
 *
 * @public
 */
export const SVTA_BUFFER_APPEND_ERROR = 2023 as const

/**
 * SVTA 2 [Playback] 024: Buffer remove error
 *
 * @public
 */
export const SVTA_BUFFER_REMOVE_ERROR = 2024 as const

/**
 * SVTA 2 [Playback] 025: Buffer full error
 *
 * @public
 */
export const SVTA_BUFFER_FULL_ERROR = 2025 as const

/**
 * SVTA 2 [Playback] 026: Buffer seek over hole
 *
 * @public
 */
export const SVTA_BUFFER_SEEK_OVER_HOLE = 2026 as const

/**
 * SVTA 2 [Playback] 027: Buffer nudge on stall
 *
 * @public
 */
export const SVTA_BUFFER_NUDGE_ON_STALL = 2027 as const

/**
 * SVTA 2 [Playback] 028: Out of memory
 *
 * @public
 */
export const SVTA_OUT_OF_MEMORY = 2028 as const

/**
 * SVTA 2 [Playback] 029: Segment load error
 *
 * @public
 */
export const SVTA_SEGMENT_LOAD_ERROR = 2029 as const

/**
 * SVTA 2 [Playback] 030: Segment timeout error
 *
 * @public
 */
export const SVTA_SEGMENT_TIMEOUT_ERROR = 2030 as const

/**
 * SVTA 2 [Playback] 031: Initialization segment error
 *
 * @public
 */
export const SVTA_INITIALIZATION_SEGMENT_ERROR = 2031 as const

/**
 * SVTA 2 [Playback] 032: Time sync failed error
 *
 * @public
 */
export const SVTA_TIME_SYNC_ERROR = 2032 as const

/**
 * SVTA 2 [Playback] 033: Fragment load error
 *
 * @public
 */
export const SVTA_FRAGMENT_LOAD_ERROR = 2033 as const

/**
 * SVTA 2 [Playback] 034: Fragment timeout error
 *
 * @public
 */
export const SVTA_FRAGMENT_TIMEOUT_ERROR = 2034 as const

/**
 * SVTA 2 [Playback] 035: Live timeshifting content out of bounds
 *
 * @public
 */
export const SVTA_LIVE_TIMESHIFT_OUT_OF_BOUNDS = 2035 as const

/**
 * SVTA 2 [Playback] 036: Switched to higher latency
 *
 * @public
 */
export const SVTA_SWITCHED_TO_HIGHER_LATENCY = 2036 as const

/**
 * SVTA 2 [Playback] 037: Unable to switch to fullscreen
 *
 * @public
 */
export const SVTA_FULLSCREEN_ERROR = 2037 as const

/**
 * SVTA 2 [Playback] 038: Unable to present picture-in-picture
 *
 * @public
 */
export const SVTA_PICTURE_IN_PICTURE_ERROR = 2038 as const

/**
 * SVTA 2 [Playback] 039: Manifest feature unsupported
 *
 * @public
 */
export const SVTA_MANIFEST_FEATURE_UNSUPPORTED = 2039 as const

/**
 * SVTA 2 [Playback] 040: Content steering manifest load error
 *
 * @public
 */
export const SVTA_CONTENT_STEERING_MANIFEST_LOAD_ERROR = 2040 as const

/**
 * SVTA 2 [Playback] 041: Unable to parse content steering manifest
 *
 * @public
 */
export const SVTA_CONTENT_STEERING_MANIFEST_PARSE_ERROR = 2041 as const

/**
 * SVTA standardized error codes in the Playback category (2xxx): the
 * player is unable to sustain the playback experience.
 *
 * When signalling a buffer event for a track the player cannot identify,
 * the spec designates {@link (SvtaPlaybackErrorCode:variable).VIDEO_BUFFER_UNDERRUN}
 * as the default.
 *
 * @see {@link https://www.svta.org/product/svta2070/ | SVTA2070: Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaPlaybackErrorCode = {
	/**
	 * Unknown playback error
	 */
	UNKNOWN: SVTA_PLAYBACK_UNKNOWN as typeof SVTA_PLAYBACK_UNKNOWN,

	/**
	 * Video buffer underrun
	 */
	VIDEO_BUFFER_UNDERRUN: SVTA_VIDEO_BUFFER_UNDERRUN as typeof SVTA_VIDEO_BUFFER_UNDERRUN,

	/**
	 * Audio buffer underrun
	 */
	AUDIO_BUFFER_UNDERRUN: SVTA_AUDIO_BUFFER_UNDERRUN as typeof SVTA_AUDIO_BUFFER_UNDERRUN,

	/**
	 * Video buffering timeout
	 */
	VIDEO_BUFFERING_TIMEOUT: SVTA_VIDEO_BUFFERING_TIMEOUT as typeof SVTA_VIDEO_BUFFERING_TIMEOUT,

	/**
	 * Audio buffering timeout
	 */
	AUDIO_BUFFERING_TIMEOUT: SVTA_AUDIO_BUFFERING_TIMEOUT as typeof SVTA_AUDIO_BUFFERING_TIMEOUT,

	/**
	 * Unable to parse manifest
	 */
	MANIFEST_PARSE_ERROR: SVTA_MANIFEST_PARSE_ERROR as typeof SVTA_MANIFEST_PARSE_ERROR,

	/**
	 * Segment parse error
	 */
	SEGMENT_PARSE_ERROR: SVTA_SEGMENT_PARSE_ERROR as typeof SVTA_SEGMENT_PARSE_ERROR,

	/**
	 * Unable to decode video
	 */
	VIDEO_DECODE_ERROR: SVTA_VIDEO_DECODE_ERROR as typeof SVTA_VIDEO_DECODE_ERROR,

	/**
	 * Unable to decode audio
	 */
	AUDIO_DECODE_ERROR: SVTA_AUDIO_DECODE_ERROR as typeof SVTA_AUDIO_DECODE_ERROR,

	/**
	 * Video dropped frame count exceeds threshold
	 */
	VIDEO_DROPPED_FRAMES_EXCEEDED: SVTA_VIDEO_DROPPED_FRAMES_EXCEEDED as typeof SVTA_VIDEO_DROPPED_FRAMES_EXCEEDED,

	/**
	 * Playhead exceeds content duration
	 */
	PLAYHEAD_EXCEEDS_CONTENT_DURATION: SVTA_PLAYHEAD_EXCEEDS_CONTENT_DURATION as typeof SVTA_PLAYHEAD_EXCEEDS_CONTENT_DURATION,

	/**
	 * No supported video track
	 */
	NO_SUPPORTED_VIDEO_TRACK: SVTA_NO_SUPPORTED_VIDEO_TRACK as typeof SVTA_NO_SUPPORTED_VIDEO_TRACK,

	/**
	 * No supported audio track
	 */
	NO_SUPPORTED_AUDIO_TRACK: SVTA_NO_SUPPORTED_AUDIO_TRACK as typeof SVTA_NO_SUPPORTED_AUDIO_TRACK,

	/**
	 * No matching codec / profile / level
	 */
	NO_MATCHING_CODEC: SVTA_NO_MATCHING_CODEC as typeof SVTA_NO_MATCHING_CODEC,

	/**
	 * Primary manifest load error
	 */
	PRIMARY_MANIFEST_LOAD_ERROR: SVTA_PRIMARY_MANIFEST_LOAD_ERROR as typeof SVTA_PRIMARY_MANIFEST_LOAD_ERROR,

	/**
	 * Primary manifest load timeout
	 */
	PRIMARY_MANIFEST_LOAD_TIMEOUT: SVTA_PRIMARY_MANIFEST_LOAD_TIMEOUT as typeof SVTA_PRIMARY_MANIFEST_LOAD_TIMEOUT,

	/**
	 * Unable to parse track from manifest
	 */
	MANIFEST_TRACK_PARSE_ERROR: SVTA_MANIFEST_TRACK_PARSE_ERROR as typeof SVTA_MANIFEST_TRACK_PARSE_ERROR,

	/**
	 * Secondary manifest / asset list load error
	 */
	SECONDARY_MANIFEST_LOAD_ERROR: SVTA_SECONDARY_MANIFEST_LOAD_ERROR as typeof SVTA_SECONDARY_MANIFEST_LOAD_ERROR,

	/**
	 * Unable to parse secondary manifest / asset list
	 */
	SECONDARY_MANIFEST_PARSE_ERROR: SVTA_SECONDARY_MANIFEST_PARSE_ERROR as typeof SVTA_SECONDARY_MANIFEST_PARSE_ERROR,

	/**
	 * Unable to switch tracks
	 */
	TRACK_SWITCH_ERROR: SVTA_TRACK_SWITCH_ERROR as typeof SVTA_TRACK_SWITCH_ERROR,

	/**
	 * Track load error
	 */
	TRACK_LOAD_ERROR: SVTA_TRACK_LOAD_ERROR as typeof SVTA_TRACK_LOAD_ERROR,

	/**
	 * Remux issue
	 */
	REMUX_ERROR: SVTA_REMUX_ERROR as typeof SVTA_REMUX_ERROR,

	/**
	 * Buffer initialization error
	 */
	BUFFER_INITIALIZATION_ERROR: SVTA_BUFFER_INITIALIZATION_ERROR as typeof SVTA_BUFFER_INITIALIZATION_ERROR,

	/**
	 * Buffer append error
	 */
	BUFFER_APPEND_ERROR: SVTA_BUFFER_APPEND_ERROR as typeof SVTA_BUFFER_APPEND_ERROR,

	/**
	 * Buffer remove error
	 */
	BUFFER_REMOVE_ERROR: SVTA_BUFFER_REMOVE_ERROR as typeof SVTA_BUFFER_REMOVE_ERROR,

	/**
	 * Buffer full error
	 */
	BUFFER_FULL_ERROR: SVTA_BUFFER_FULL_ERROR as typeof SVTA_BUFFER_FULL_ERROR,

	/**
	 * Buffer seek over hole
	 */
	BUFFER_SEEK_OVER_HOLE: SVTA_BUFFER_SEEK_OVER_HOLE as typeof SVTA_BUFFER_SEEK_OVER_HOLE,

	/**
	 * Buffer nudge on stall
	 */
	BUFFER_NUDGE_ON_STALL: SVTA_BUFFER_NUDGE_ON_STALL as typeof SVTA_BUFFER_NUDGE_ON_STALL,

	/**
	 * Out of memory
	 */
	OUT_OF_MEMORY: SVTA_OUT_OF_MEMORY as typeof SVTA_OUT_OF_MEMORY,

	/**
	 * Segment load error
	 */
	SEGMENT_LOAD_ERROR: SVTA_SEGMENT_LOAD_ERROR as typeof SVTA_SEGMENT_LOAD_ERROR,

	/**
	 * Segment timeout error
	 */
	SEGMENT_TIMEOUT_ERROR: SVTA_SEGMENT_TIMEOUT_ERROR as typeof SVTA_SEGMENT_TIMEOUT_ERROR,

	/**
	 * Initialization segment error
	 */
	INITIALIZATION_SEGMENT_ERROR: SVTA_INITIALIZATION_SEGMENT_ERROR as typeof SVTA_INITIALIZATION_SEGMENT_ERROR,

	/**
	 * Time sync failed error
	 */
	TIME_SYNC_ERROR: SVTA_TIME_SYNC_ERROR as typeof SVTA_TIME_SYNC_ERROR,

	/**
	 * Fragment load error
	 */
	FRAGMENT_LOAD_ERROR: SVTA_FRAGMENT_LOAD_ERROR as typeof SVTA_FRAGMENT_LOAD_ERROR,

	/**
	 * Fragment timeout error
	 */
	FRAGMENT_TIMEOUT_ERROR: SVTA_FRAGMENT_TIMEOUT_ERROR as typeof SVTA_FRAGMENT_TIMEOUT_ERROR,

	/**
	 * Live timeshifting content out of bounds
	 */
	LIVE_TIMESHIFT_OUT_OF_BOUNDS: SVTA_LIVE_TIMESHIFT_OUT_OF_BOUNDS as typeof SVTA_LIVE_TIMESHIFT_OUT_OF_BOUNDS,

	/**
	 * Switched to higher latency
	 */
	SWITCHED_TO_HIGHER_LATENCY: SVTA_SWITCHED_TO_HIGHER_LATENCY as typeof SVTA_SWITCHED_TO_HIGHER_LATENCY,

	/**
	 * Unable to switch to fullscreen
	 */
	FULLSCREEN_ERROR: SVTA_FULLSCREEN_ERROR as typeof SVTA_FULLSCREEN_ERROR,

	/**
	 * Unable to present picture-in-picture
	 */
	PICTURE_IN_PICTURE_ERROR: SVTA_PICTURE_IN_PICTURE_ERROR as typeof SVTA_PICTURE_IN_PICTURE_ERROR,

	/**
	 * Manifest feature unsupported
	 */
	MANIFEST_FEATURE_UNSUPPORTED: SVTA_MANIFEST_FEATURE_UNSUPPORTED as typeof SVTA_MANIFEST_FEATURE_UNSUPPORTED,

	/**
	 * Content steering manifest load error
	 */
	CONTENT_STEERING_MANIFEST_LOAD_ERROR: SVTA_CONTENT_STEERING_MANIFEST_LOAD_ERROR as typeof SVTA_CONTENT_STEERING_MANIFEST_LOAD_ERROR,

	/**
	 * Unable to parse content steering manifest
	 */
	CONTENT_STEERING_MANIFEST_PARSE_ERROR: SVTA_CONTENT_STEERING_MANIFEST_PARSE_ERROR as typeof SVTA_CONTENT_STEERING_MANIFEST_PARSE_ERROR,
} as const

/**
 * Union type of all {@link (SvtaPlaybackErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaPlaybackErrorCode = ValueOf<typeof SvtaPlaybackErrorCode>
