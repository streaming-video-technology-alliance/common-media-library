import { SvtaAccessibilityErrorCode } from './SvtaAccessibilityErrorCode.ts'
import { SvtaAdvertisingErrorCode } from './SvtaAdvertisingErrorCode.ts'
import { SvtaContentProtectionErrorCode } from './SvtaContentProtectionErrorCode.ts'
import { SvtaCustomErrorCode } from './SvtaCustomErrorCode.ts'
import { SvtaErrorCategory } from './SvtaErrorCategory.ts'
import { SvtaMediaContentErrorCode } from './SvtaMediaContentErrorCode.ts'
import { SvtaNetworkErrorCode } from './SvtaNetworkErrorCode.ts'
import { SvtaPlaybackErrorCode } from './SvtaPlaybackErrorCode.ts'
import { SvtaRemotePlayErrorCode } from './SvtaRemotePlayErrorCode.ts'
import { SvtaUnknownErrorCode } from './SvtaUnknownErrorCode.ts'

const SVTA_ERROR_DESCRIPTIONS: ReadonlyMap<number, string> = /* @__PURE__ */ new Map([
	[SvtaUnknownErrorCode.UNKNOWN, 'Unknown error'],

	[SvtaMediaContentErrorCode.UNKNOWN, 'Unknown media content error'],
	[SvtaMediaContentErrorCode.MEDIA_UNAVAILABLE, 'Media unavailable'],
	[SvtaMediaContentErrorCode.INVALID_MANIFEST, 'Invalid manifest'],
	[SvtaMediaContentErrorCode.TRACK_NOT_AVAILABLE, 'Track not available'],
	[SvtaMediaContentErrorCode.UNSUPPORTED_VIDEO_FORMAT, 'Unsupported video format'],
	[SvtaMediaContentErrorCode.UNSUPPORTED_AUDIO_FORMAT, 'Unsupported audio format'],
	[SvtaMediaContentErrorCode.UNSUPPORTED_TEXT_FORMAT, 'Unsupported text format'],
	[SvtaMediaContentErrorCode.INVALID_COMPOSITION_TRACK_SEGMENT_TIME, 'Invalid composition track segment time'],
	[SvtaMediaContentErrorCode.SEGMENT_EXCEEDS_TRACK_BITRATE, 'Segment exceeds specified bitrate for track'],
	[SvtaMediaContentErrorCode.MISALIGNED_TRACK_DURATION, 'Misaligned track duration'],

	[SvtaPlaybackErrorCode.UNKNOWN, 'Unknown playback error'],
	[SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN, 'Video buffer underrun'],
	[SvtaPlaybackErrorCode.AUDIO_BUFFER_UNDERRUN, 'Audio buffer underrun'],
	[SvtaPlaybackErrorCode.VIDEO_BUFFERING_TIMEOUT, 'Video buffering timeout'],
	[SvtaPlaybackErrorCode.AUDIO_BUFFERING_TIMEOUT, 'Audio buffering timeout'],
	[SvtaPlaybackErrorCode.MANIFEST_PARSE_ERROR, 'Unable to parse manifest'],
	[SvtaPlaybackErrorCode.SEGMENT_PARSE_ERROR, 'Segment parse error'],
	[SvtaPlaybackErrorCode.VIDEO_DECODE_ERROR, 'Unable to decode video'],
	[SvtaPlaybackErrorCode.AUDIO_DECODE_ERROR, 'Unable to decode audio'],
	[SvtaPlaybackErrorCode.VIDEO_DROPPED_FRAMES_EXCEEDED, 'Video dropped frame count exceeds threshold'],
	[SvtaPlaybackErrorCode.PLAYHEAD_EXCEEDS_CONTENT_DURATION, 'Playhead exceeds content duration'],
	[SvtaPlaybackErrorCode.NO_SUPPORTED_VIDEO_TRACK, 'No supported video track'],
	[SvtaPlaybackErrorCode.NO_SUPPORTED_AUDIO_TRACK, 'No supported audio track'],
	[SvtaPlaybackErrorCode.NO_MATCHING_CODEC, 'No matching codec / profile / level'],
	[SvtaPlaybackErrorCode.PRIMARY_MANIFEST_LOAD_ERROR, 'Primary manifest load error'],
	[SvtaPlaybackErrorCode.PRIMARY_MANIFEST_LOAD_TIMEOUT, 'Primary manifest load timeout'],
	[SvtaPlaybackErrorCode.MANIFEST_TRACK_PARSE_ERROR, 'Unable to parse track from manifest'],
	[SvtaPlaybackErrorCode.SECONDARY_MANIFEST_LOAD_ERROR, 'Secondary manifest / asset list load error'],
	[SvtaPlaybackErrorCode.SECONDARY_MANIFEST_PARSE_ERROR, 'Unable to parse secondary manifest / asset list'],
	[SvtaPlaybackErrorCode.TRACK_SWITCH_ERROR, 'Unable to switch tracks'],
	[SvtaPlaybackErrorCode.TRACK_LOAD_ERROR, 'Track load error'],
	[SvtaPlaybackErrorCode.REMUX_ERROR, 'Remux issue'],
	[SvtaPlaybackErrorCode.BUFFER_INITIALIZATION_ERROR, 'Buffer initialization error'],
	[SvtaPlaybackErrorCode.BUFFER_APPEND_ERROR, 'Buffer append error'],
	[SvtaPlaybackErrorCode.BUFFER_REMOVE_ERROR, 'Buffer remove error'],
	[SvtaPlaybackErrorCode.BUFFER_FULL_ERROR, 'Buffer full error'],
	[SvtaPlaybackErrorCode.BUFFER_SEEK_OVER_HOLE, 'Buffer seek over hole'],
	[SvtaPlaybackErrorCode.BUFFER_NUDGE_ON_STALL, 'Buffer nudge on stall'],
	[SvtaPlaybackErrorCode.OUT_OF_MEMORY, 'Out of memory'],
	[SvtaPlaybackErrorCode.SEGMENT_LOAD_ERROR, 'Segment load error'],
	[SvtaPlaybackErrorCode.SEGMENT_TIMEOUT_ERROR, 'Segment timeout error'],
	[SvtaPlaybackErrorCode.INITIALIZATION_SEGMENT_ERROR, 'Initialization segment error'],
	[SvtaPlaybackErrorCode.TIME_SYNC_ERROR, 'Time sync failed error'],
	[SvtaPlaybackErrorCode.FRAGMENT_LOAD_ERROR, 'Fragment load error'],
	[SvtaPlaybackErrorCode.FRAGMENT_TIMEOUT_ERROR, 'Fragment timeout error'],
	[SvtaPlaybackErrorCode.LIVE_TIMESHIFT_OUT_OF_BOUNDS, 'Live timeshifting content out of bounds'],
	[SvtaPlaybackErrorCode.SWITCHED_TO_HIGHER_LATENCY, 'Switched to higher latency'],
	[SvtaPlaybackErrorCode.FULLSCREEN_ERROR, 'Unable to switch to fullscreen'],
	[SvtaPlaybackErrorCode.PICTURE_IN_PICTURE_ERROR, 'Unable to present picture-in-picture'],
	[SvtaPlaybackErrorCode.MANIFEST_FEATURE_UNSUPPORTED, 'Manifest feature unsupported'],
	[SvtaPlaybackErrorCode.CONTENT_STEERING_MANIFEST_LOAD_ERROR, 'Content steering manifest load error'],
	[SvtaPlaybackErrorCode.CONTENT_STEERING_MANIFEST_PARSE_ERROR, 'Unable to parse content steering manifest'],

	[SvtaNetworkErrorCode.UNKNOWN, 'Unknown network error'],
	[SvtaNetworkErrorCode.NO_NETWORK_CONNECTION, 'No network connection'],
	[SvtaNetworkErrorCode.HTTP_TIMEOUT, 'HTTP timeout'],
	[SvtaNetworkErrorCode.HOST_RESOLUTION_ERROR, 'Unable to resolve host'],
	[SvtaNetworkErrorCode.RESOURCE_NOT_FOUND, 'Resource not found'],
	[SvtaNetworkErrorCode.INVALID_URI, 'Invalid URI'],
	[SvtaNetworkErrorCode.UNSUPPORTED_URI_SCHEME, 'Unsupported URI scheme'],
	[SvtaNetworkErrorCode.DOWNLOAD_ERROR, 'Download error'],
	[SvtaNetworkErrorCode.MAX_RETRIES_EXCEEDED, 'Max retries have been exceeded'],
	[SvtaNetworkErrorCode.INSUFFICIENT_BANDWIDTH, 'Insufficient bandwidth to support playback of current presentation'],
	[SvtaNetworkErrorCode.RESOURCE_DENIED, 'Resource denied'],
	[SvtaNetworkErrorCode.INVALID_HTTP_CONTENT_TYPE, 'Invalid HTTP content type value'],

	[SvtaContentProtectionErrorCode.UNKNOWN, 'Unknown content protection error'],
	[SvtaContentProtectionErrorCode.CONCURRENT_STREAM_LIMIT_EXCEEDED, 'Concurrent stream limit exceeded'],
	[SvtaContentProtectionErrorCode.ENTITLEMENT_REFUSED, 'Entitlement refused'],
	[SvtaContentProtectionErrorCode.LICENSE_EXPIRED, 'License expired'],
	[SvtaContentProtectionErrorCode.BAD_LICENSE_REQUEST, 'Bad license request'],
	[SvtaContentProtectionErrorCode.LICENSE_SERVER_TIMEOUT, 'License server timeout'],
	[SvtaContentProtectionErrorCode.INSUFFICIENT_DRM_ROBUSTNESS, 'Insufficient DRM robustness level'],
	[SvtaContentProtectionErrorCode.INSUFFICIENT_OUTPUT_PROTECTION, 'Insufficient output protection'],
	[SvtaContentProtectionErrorCode.UNSUPPORTED_DRM_SYSTEM, 'Unsupported or unavailable DRM system'],
	[SvtaContentProtectionErrorCode.GEO_RESTRICTED, 'Access restricted due to unsupported geo'],
	[SvtaContentProtectionErrorCode.DRM_INITIALIZATION_ERROR, 'DRM initialization error'],
	[SvtaContentProtectionErrorCode.CDN_UNAUTHORIZED, 'CDN unauthorized'],
	[SvtaContentProtectionErrorCode.INVALID_ACCESS_TOKEN, 'Invalid access token'],
	[SvtaContentProtectionErrorCode.DRM_CERTIFICATE_ERROR, 'DRM certificate error'],
	[SvtaContentProtectionErrorCode.DRM_SESSION_ERROR, 'DRM session error'],
	[SvtaContentProtectionErrorCode.DRM_CONFIGURATION_MISSING, 'DRM initialization data or configuration missing'],
	[SvtaContentProtectionErrorCode.LICENSE_RESPONSE_REJECTED, 'DRM license response rejected'],
	[SvtaContentProtectionErrorCode.PERSISTENT_SESSION_ERROR, 'Persistent session DRM error'],
	[SvtaContentProtectionErrorCode.PERMISSION_REJECTED, 'Required permission rejected'],
	[SvtaContentProtectionErrorCode.KEY_LOAD_ERROR, 'Failed to load decryption key'],
	[SvtaContentProtectionErrorCode.SEGMENT_DECRYPTION_ERROR, 'Failed to decrypt segment'],
	[SvtaContentProtectionErrorCode.LICENSE_REQUEST_GENERATION_ERROR, 'Failed to generate DRM license request'],

	[SvtaAccessibilityErrorCode.UNKNOWN, 'Unknown accessibility error'],
	[SvtaAccessibilityErrorCode.TIMED_TEXT_PARSE_ERROR, 'Unable to parse timed text'],
	[SvtaAccessibilityErrorCode.TIMED_TEXT_RENDER_ERROR, 'Unable to render timed text'],
	[SvtaAccessibilityErrorCode.TIMED_TEXT_EXCEEDS_CONTENT_DURATION, 'Timed text exceeds content duration'],
	[SvtaAccessibilityErrorCode.AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION, 'Audio description exceeds content duration'],

	[SvtaRemotePlayErrorCode.UNKNOWN, 'Unknown remote play error'],
	[SvtaRemotePlayErrorCode.SENDER_INITIALIZATION_ERROR, 'Sender unable to initialize remote play'],
	[SvtaRemotePlayErrorCode.SENDER_CONNECTION_ERROR, 'Sender unable to make a connection to the receiver'],
	[SvtaRemotePlayErrorCode.RECEIVER_UNAVAILABLE, 'Receiver does not exist or is unavailable'],
	[SvtaRemotePlayErrorCode.RECEIVER_CONNECTION_REFUSED, 'Receiver refused remote play connection'],
	[SvtaRemotePlayErrorCode.RECEIVER_CONNECTION_LOST, 'Connection to the receiver lost'],
	[SvtaRemotePlayErrorCode.SENDER_CONNECTION_LOST, 'Connection to the sender lost'],
	[SvtaRemotePlayErrorCode.RECEIVER_UNSUPPORTED_STREAM, 'Receiver is not supported to playback this stream'],
	[SvtaRemotePlayErrorCode.RECEIVER_ALREADY_IN_REMOTE_PLAY, 'Receiver is already in remote play'],
	[SvtaRemotePlayErrorCode.RECEIVER_PLAYBACK_ERROR, 'Receiver terminated playback because of an error'],

	[SvtaAdvertisingErrorCode.UNKNOWN, 'Unknown advertising error'],
	[SvtaAdvertisingErrorCode.AD_BLOCKER_DETECTED, 'Ad blocker detected'],
	[SvtaAdvertisingErrorCode.VAST_PARSE_ERROR, 'Unable to parse VAST XML'],
	[SvtaAdvertisingErrorCode.VAST_SCHEMA_VALIDATION_ERROR, 'Invalid VAST schema'],
	[SvtaAdvertisingErrorCode.VAST_VERSION_UNSUPPORTED, 'VAST response version not supported'],
	[SvtaAdvertisingErrorCode.AD_TYPE_MISMATCH, 'Video player expected different ad type'],
	[SvtaAdvertisingErrorCode.LINEARITY_MISMATCH, 'Creative has different linearity than player expected (non-fatal)'],
	[SvtaAdvertisingErrorCode.DURATION_MISMATCH, 'Creative has different duration than player expected (non-fatal)'],
	[SvtaAdvertisingErrorCode.SIZE_MISMATCH, 'Creative has different size than player expected (non-fatal)'],
	[SvtaAdvertisingErrorCode.WRAPPER_ERROR, 'Wrapper failed to deliver VAST response for unknown reason'],
	[SvtaAdvertisingErrorCode.WRAPPER_TIMEOUT, 'VAST response redirect timed out'],
	[SvtaAdvertisingErrorCode.WRAPPER_LIMIT_REACHED, 'Wrapper limit reached (e.g. too many redirects)'],
	[SvtaAdvertisingErrorCode.EMPTY_WRAPPER_RESPONSE, 'VAST response was empty'],
	[SvtaAdvertisingErrorCode.LINEAR_AD_ERROR, 'Unable to display linear ad'],
	[SvtaAdvertisingErrorCode.MEDIA_FILE_NOT_FOUND, 'Media file not found'],
	[SvtaAdvertisingErrorCode.MEDIA_FILE_UNAVAILABLE, 'Media file unavailable'],
	[SvtaAdvertisingErrorCode.NO_SUPPORTED_MEDIA_TYPE, 'VAST response contained no supported MIME types'],
	[SvtaAdvertisingErrorCode.MEDIA_FILE_DISPLAY_ERROR, 'Unable to display media file'],
	[SvtaAdvertisingErrorCode.MEZZANINE_MISSING, 'Required mezzanine file missing'],
	[SvtaAdvertisingErrorCode.MEZZANINE_DOWNLOADING, 'Mezzanine file was downloaded for the first time'],
	[SvtaAdvertisingErrorCode.REJECTED_AD, 'VAST response contained rejected ad'],
	[SvtaAdvertisingErrorCode.INTERACTIVE_CREATIVE_ERROR, 'Could not execute creative defined in interactiveCreativeFile'],
	[SvtaAdvertisingErrorCode.VERIFICATION_ERROR, 'Could not execute code in verification node'],
	[SvtaAdvertisingErrorCode.NONLINEAR_AD_ERROR, 'Video player unable to display non-linear ad for unknown reason'],
	[SvtaAdvertisingErrorCode.NONLINEAR_DIMENSION_MISMATCH, 'Non-linear ad dimensions did not match display area'],
	[SvtaAdvertisingErrorCode.NONLINEAR_AD_FETCH_ERROR, 'Unable to fetch non-linear ad resource'],
	[SvtaAdvertisingErrorCode.UNSUPPORTED_NONLINEAR_AD, 'Non-linear ad did not contain a supported type'],
	[SvtaAdvertisingErrorCode.COMPANION_AD_ERROR, 'Could not display companion ad (non-fatal)'],
	[SvtaAdvertisingErrorCode.COMPANION_DIMENSION_MISMATCH, 'Companion ad dimensions did not match display area'],
	[SvtaAdvertisingErrorCode.REQUIRED_COMPANION_AD_ERROR, 'Unable to display required companion ad'],
	[SvtaAdvertisingErrorCode.COMPANION_AD_FETCH_ERROR, 'Unable to fetch companion ad resource'],
	[SvtaAdvertisingErrorCode.UNDEFINED_VAST_ERROR, 'Undefined VAST error'],
	[SvtaAdvertisingErrorCode.VPAID_ERROR, 'Unknown VPAID error'],
	[SvtaAdvertisingErrorCode.EMPTY_VAST_RESPONSE, 'VAST response document was empty'],

	[SvtaCustomErrorCode.UNKNOWN, 'Unknown custom error'],
])

/**
 * Get the human readable description of an SVTA error code, as defined
 * by the spec's error index tables. Descriptions for embedded HTTP
 * statuses without a named code are synthesized as
 * `Received an HTTP <status> response`.
 *
 * @param code - An SVTA error code.
 * @returns The description, or `undefined` if the code is not assigned
 * by the spec.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/getSvtaErrorDescription.test.ts#example}
 */
export function getSvtaErrorDescription(code: number): string | undefined {
	const description = SVTA_ERROR_DESCRIPTIONS.get(code)

	if (description !== undefined) {
		return description
	}

	const base = SvtaErrorCategory.NETWORK * 1000

	if (Number.isInteger(code) && code >= base + 100 && code <= base + 599) {
		return `Received an HTTP ${code - base} response`
	}

	return undefined
}
