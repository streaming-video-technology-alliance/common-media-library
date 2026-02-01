import type { SfItem } from '@svta/cml-structured-field-values'
import type { ValueOrArray } from '@svta/cml-utils'
import type { CmcdCustomKey } from './CmcdCustomKey.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdObjectType } from './CmcdObjectType.ts'
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
import type { CmcdPlayerState } from './CmcdPlayerState.ts'
import type { CmcdStreamType } from './CmcdStreamType.ts'
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.ts'
import type { CmcdValue } from './CmcdValue.ts'

/**
 * Common Media Client Data (CMCD) version 2.
 *
 * A standardized set of HTTP request header fields, query string parameters,
 * and event reporting fields for communicating media playback metrics.
 *
 * @see {@link https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf|CMCD v1 Spec}
 *
 * @public
 */
export type Cmcd = {

	/**
	 * Custom key names may be used, but they MUST carry a hyphenated prefix to ensure that there will not be a namespace collision
	 * with future revisions to this specification. Clients SHOULD use a reverse-DNS syntax when defining their own prefix.
	 */
	[index: CmcdCustomKey]: CmcdValue | undefined;

	/////////////////
	// CMCD Object //
	/////////////////

	/**
	 * Aggregate encoded bitrate
	 *
	 * The aggregate encoded bitrate across a playable combination of tracks. This metric SHOULD NOT be used when the individual bitrates
	 * of the tracks are known. This value SHOULD be derived from a playlist/manifest declaration, or it MAY be estimated by the player.
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. This value MUST NOT be sent if
	 * the encoded bitrate is known.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	ab?: CmcdObjectTypeList;

	/**
	 * Encoded bitrate
	 *
	 * The encoded bitrate. In request mode, this refers to the encoded bitrate of the requested representation.
	 * In event mode this refers to the encoded bitrate of the currently selected representation.
	 * This SHOULD be derived from playlist/manifest declarations, or it MAY be estimated by the player.
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	br?: CmcdObjectTypeList;

	/**
	 * Object duration
	 *
	 * The playback duration in milliseconds of the object being requested. If a partial segment is being requested,
	 * then this value MUST indicate the playback duration of that part and not that of its parent segment.
	 * This value can be an approximation of the estimated duration if the explicit value is not known.
	 * This value MUST NOT be sent for objects which do not have an object type of 'a', 'v', 'av', 'tt', 'c', or 'o'.
	 *
	 * Integer milliseconds
	 */
	d?: number;

	/**
	 * Lowest aggregated encoded bitrate
	 *
	 * The lowest aggregated bitrate rendition in the manifest or playlist. This SHOULD be derived from playlist/manifest declarations,
	 * or it MAY be estimated by the player. If the playlist declares both peak and average bitrate values, the peak value MUST be
	 * transmitted. The aggregate encoded bitrate is of the complete media object including all object types. This value MUST NOT be
	 * sent if the lowest encoded bitrate is known.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	lab?: CmcdObjectTypeList;

	/**
	 * Lowest encoded bitrate
	 *
	 * The lowest bitrate rendition in the manifest or playlist. This SHOULD be derived from playlist/manifest declarations, or it MAY be
	 * estimated by the player. If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. This
	 * lowest bitrate MUST apply to the object type being requested. Requests for video objects MUST specify the lowest video bitrate and
	 * requests for audio objects MUST specify the lowest audio bitrate.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	lb?: CmcdObjectTypeList;

	/**
	 * Object type
	 *
	 * The media type of the current object being requested:
	 * - `m` = text file, such as a manifest or playlist
	 * - `a` = audio only
	 * - `v` = video only
	 * - `av` = muxed audio and video
	 * - `i` = init segment
	 * - `c` = caption or subtitle
	 * - `tt` = ISOBMFF timed text track
	 * - `k` = cryptographic key, license or certificate.
	 * - `o` = other
	 *
	 * If the object type being requested is unknown, then this key MUST NOT be used.
	 *
	 * This key is also used as a token parameter for other keys.
	 *
	 * Token
	 */
	ot?: CmcdObjectType;

	/**
	 * Top aggregated encoded bitrate
	 *
	 * The highest aggregated bitrate rendition in the manifest or playlist. This SHOULD be derived from playlist/manifest declarations,
	 * or it MAY be estimated by the player. If the playlist declares both peak and average bitrate values, the peak value MUST be
	 * transmitted. The aggregate encoded bitrate is of the complete media object including all object types. This value MUST NOT be
	 * sent if the top encoded bitrate is known.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	tab?: CmcdObjectTypeList;

	/**
	 * Top encoded bitrate
	 *
	 * The highest bitrate rendition in the manifest or playlist. This SHOULD be derived from playlist/manifest declarations,
	 * or it MAY be estimated by the player. If the playlist declares both peak and average bitrate values, the peak value
	 * MUST be transmitted. This top bitrate MUST apply to the object type being requested. Requests for video objects MUST
	 * specify the top video bitrate and requests for audio objects MUST specify the top audio bitrate.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	tb?: CmcdObjectTypeList;

	/**
	 * Top playable bitrate
	 *
	 * The highest bitrate rendition that the player is currently capable of playing for reasons other than bandwidth limitations. This
	 * key captures the cases in which, for example, screen resolution, DRM, or performance constraints limit the player's topmost choice
	 * of bitrate. These constraints are intentionally obfuscated for privacy reasons.
	 *
	 * This key can increase the fingerprinting surface exposed by CMCD transmission and SHOULD NOT be transmitted in a default player
	 * configuration.
	 *
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. This top playable bitrate MUST
	 * apply to the object type being requested. Requests for video objects MUST specify the top playable video bitrate and requests for
	 * audio objects MUST specify the top playable audio bitrate. This value MUST NOT be sent for objects which do not have an object type
	 * of 'a', 'v', 'av' or 'c'.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	tpb?: CmcdObjectTypeList;

	//////////////////
	// CMCD Request //
	//////////////////

	/**
	 * Buffer length
	 *
	 * The buffer length associated with the media object being requested. This value SHOULD be rounded to the nearest 100 ms.
	 *
	 * Inner list of integer milliseconds with token identifiers
	 */
	bl?: CmcdObjectTypeList;

	/**
	 * Content Signature
	 *
	 * A string representing a signature of the content being played. This field SHOULD vary with content ID and be bound by some mechanism
	 * to the content. For example, this field may be used to transmit the C2PA signature associated with the content being viewed.
	 *
	 * String
	 */
	cs?: string;

	/**
	 * Dropped Frames Absolute
	 *
	 * An absolute count of dropped frames since session initiation. This key SHOULD only be sent for content types of 'v', 'av' or 'o'.
	 * Note that this value will be driven by the content being rendered rather than the content being retrieved, therefore it is
	 * beneficial if accompanied by the playhead time 'pt' key to allow for correct interpretation.
	 *
	 * Integer
	 */
	dfa?: number;

	/**
	 * Deadline
	 *
	 * Deadline from the request time until the first sample of this Segment/Object needs to be available in order to not create a buffer underrun
	 * or any other playback problems. This value MUST be rounded to the nearest 100ms. For a playback rate of 1, this may be equivalent to the
	 * player's remaining buffer length.
	 *
	 * Integer milliseconds
	 */
	dl?: number;

	/**
	 * Live stream latency
	 *
	 * The time delta between when a given media timestamp was made available at the origin and when it was rendered by the player. The
	 * accuracy of this estimate is dependent on synchronization between the packager and the player clocks.
	 *
	 * Integer milliseconds
	 */
	ltc?: number;

	/**
	 * Measured throughput
	 *
	 * The throughput between player and server, as measured by the player. Throughput MUST be rounded to the nearest 100 kbps. This value, however
	 * derived, SHOULD be the value that the player is using to make its next Adaptive Bitrate switching decision. If the player is requesting
	 * different object types from different providers then it SHOULD take care to match the throughput measured against that provider with each
	 * object type request. It is acceptable to report aggregate information if objects of the same type are requested from different providers.
	 * If the player has multiple concurrent connections to the provider, then the intent is that this value communicates the aggregate throughput
	 * the player sees across all those connections. If this key is sent on an interval report, the value transmitted should be the last throughput
	 * estimate made by the player prior to making the report. There is no requirement for the player to calculate the average measured throughput
	 * since the prior interval report.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	mtp?: CmcdObjectTypeList;

	/**
	 * Next object request
	 *
	 * The relative path, as defined by RFC 3986, to one or more objects which can reasonably be expected to be requested by the player making
	 * the current request. Each object SHOULD be fetched in its entirety unless there is a range associated with the future request. Even if
	 * only one object is being specified, the list notation MUST still be used. If there is a range associated with the future request, then
	 * the range is communicated as the parameter 'r' with a String value. The formatting of the String value is similar to the HTTP Range
	 * header, except that the unit MUST be 'byte', the 'Range:' prefix is NOT permitted, specifying multiple ranges is NOT allowed and the
	 * only valid combinations are:
	 *
	 * - `"<range-start>-"`
	 * - `"<range-start>-<range-end>"`
	 * - `"-<suffix-length>"`
	 *
	 * The player SHOULD NOT depend upon any pre-fetch action being taken - it is merely a request for such a pre-fetch to take place.
	 *
	 * Inner list of strings
	 */
	nor?: ValueOrArray<string | SfItem<string, { r: string }>>;

	/**
	 * Playhead bitrate
	 *
	 * The encoded bitrate of the media object(s) being shown to the end user.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	pb?: CmcdObjectTypeList;

	/**
	 * Sequence Number
	 *
	 * A monotonically increasing integer to identify the sequence of a CMCD report to a target within a session. This MUST be reset to
	 * zero on the start of a new session-id. Sequence numbers increase independently per each combination of mode and target.
	 *
	 * Integer
	 */
	sn?: number;

	/**
	 * State
	 *
	 * A token describing the current playback state of the player as perceived by the end user, one of:
	 *
	 * - `s` - starting: the player has been instructed to play media for a given session, either by a user interaction or by an autoplay action.
	 * - `p` - playing: Media is being rendered.
	 * - `k` - seeking: The start of the action of moving the playhead position after starting.
	 * - `r` - rebuffering: Media has stopped being rendered due to an insufficient buffer. This state is not reported during startup or seeking.
	 * - `a` - paused: Playback has been intentionally paused by either the user or the player.
	 * - `e` - ended: Rendering has ended due to completion of the media asset playback.
	 * - `f` - fatal error: Rendering has ended due to an irrecoverable error.
	 * - `q` - quit: User initiated end of playback before media asset completion.
	 * - `d` - preloading: the player is loading, or has loaded, assets ahead of starting in order to provide a fast startup. The expectation is that playback will commence at a future time.
	 *
	 * Token - one of [s,p,k,r,a,e,f,q,d]
	 */
	sta?: CmcdPlayerState;

	/**
	 * Startup
	 *
	 * Key is included without a value if the object is needed urgently due to startup, seeking or recovery after a buffer-empty event. The player
	 * reports this key as true until its buffer first reaches the target buffer for stable playback.
	 *
	 * Boolean
	 */
	su?: boolean;

	/**
	 * Target Buffer length
	 *
	 * The target buffer length associated with the media object being requested at the time of the request. This value SHOULD be rounded
	 * to the nearest 100 ms.
	 *
	 * Inner list of integer milliseconds with token identifiers
	 */
	tbl?: CmcdObjectTypeList;

	//////////////////
	// CMCD Session //
	//////////////////

	/**
	 * Content ID
	 *
	 * A unique string identifying the current content. The maximum length is 128 characters. This value is consistent across multiple different
	 * sessions and devices and is defined and updated at the discretion of the service provider.
	 *
	 * String
	 */
	cid?: string;

	/**
	 * Media Start Delay
	 *
	 * Measures the initial delay in wall-clock time from when a player is instructed to play media for a given session to when any media
	 * begins playback, whether it be primary content or interstitial content. This value SHOULD be the time difference between the
	 * "starting" and "playing" states.
	 *
	 * This key MUST only be sent once per Session ID and MUST be sent for each reporting mode which is active within the player.
	 *
	 * Integer milliseconds
	 */
	msd?: number;

	/**
	 * Playback rate
	 *
	 * 1.0 if real-time, 2.0 if double speed, 0 if not playing. SHOULD only be sent if not equal to 1.0.
	 *
	 * Decimal
	 */
	pr?: number;

	/**
	 * Streaming format
	 *
	 * The streaming format that defines the current request.
	 *
	 * - `d` = MPEG DASH
	 * - `h` = HTTP Live Streaming (HLS)
	 * - `e` = HESP
	 * - `s` = Smooth Streaming
	 * - `o` = other
	 *
	 * Token
	 */
	sf?: CmcdStreamingFormat;

	/**
	 * Session ID
	 *
	 * A GUID identifying the current playback session. A playback session typically consists of the playback of a single media asset along
	 * with accompanying content such as advertisements. This session may comprise the playback of primary content combined with interstitial
	 * content. This session is being played on a single device. The maximum length is 64 characters. It is RECOMMENDED to conform to the
	 * UUID specification.
	 *
	 * String
	 */
	sid?: string;

	/**
	 * Stream type
	 *
	 * - `v` = all segments are available - e.g., VOD
	 * - `l` = segments become available over time - e.g., LIVE
	 * - `ll` = low latency LIVE
	 *
	 * Token
	 */
	st?: CmcdStreamType;

	/**
	 * Version
	 *
	 * The version of this specification used for interpreting the defined key names and values. If this key is omitted, the player and server
	 * MUST interpret the values as being defined by version 1. Player SHOULD omit this field if the version is 1 and MUST include this field
	 * if the version is not 1.
	 *
	 * Integer
	 */
	v?: number;

	/////////////////
	// CMCD Status //
	/////////////////

	/**
	 * Backgrounded
	 *
	 * All players in a session are currently in a state that is not visible to the user due to a user interaction. This key SHOULD only
	 * be sent if it is TRUE. If the visibility state of the player is not known this key SHOULD NOT be reported.
	 *
	 * Boolean
	 */
	bg?: boolean;

	/**
	 * Buffer starvation
	 *
	 * TRUE if the player buffer was starved at some point between the prior report and this report per reporting destination, resulting in
	 * the player entering a rebuffering state or remaining in a rebuffering state. Note that if the player begins requesting data from a
	 * new CDN, then this key might initially report buffering caused by the prior CDN. This key SHOULD NOT be reported if it is FALSE.
	 *
	 * Boolean
	 */
	bs?: boolean;

	/**
	 * Buffer Starvation Absolute
	 *
	 * An absolute count of buffer starvation events since session initiation. A buffer starvation event occurs when the state changes
	 * to rebuffering. Token identifier MAY be omitted if the cause of the rebuffering is unknown.
	 *
	 * Inner list of integers with optional token identifiers
	 */
	bsa?: CmcdObjectTypeList;

	/**
	 * Buffer Starvation Duration
	 *
	 * A list of durations of each buffer starvation period reported once the rebuffering has completed. This value MUST only be reported
	 * once per reporting mode and report destination. Token identifier MAY be omitted if the cause of the rebuffering is unknown.
	 *
	 * Inner list of integer milliseconds with optional token identifiers
	 */
	bsd?: CmcdObjectTypeList;

	/**
	 * Buffer Starvation Duration Absolute
	 *
	 * An absolute count of buffer starvation duration since session initiation. Token identifier MAY be omitted if the cause of the
	 * rebuffering is unknown.
	 *
	 * Inner list of integer milliseconds with optional token identifiers
	 */
	bsda?: CmcdObjectTypeList;

	/**
	 * CDN ID
	 *
	 * A string identifying the current delivery network from which the player is retrieving content. Maximum length is 128 characters.
	 *
	 * String
	 */
	cdn?: string;

	/**
	 * Player Error Code
	 *
	 * A string defining an error code produced by the player. The namespace and formatting of this error code is left to the application.
	 *
	 * Even if only one error code is being specified, the list notation MUST still be used.
	 *
	 * Inner list of strings
	 */
	ec?: string[];

	/**
	 * Non rendered
	 *
	 * True when the content being retrieved by a player is not rendered as audio or video. The key SHOULD only be sent when it is TRUE.
	 *
	 * Boolean
	 */
	nr?: boolean;

	/**
	 * Playhead time
	 *
	 * The playhead time, expressed in milliseconds, which is being rendered to the viewer when the report is made.
	 *
	 * Integer milliseconds
	 */
	pt?: number;

	/**
	 * Requested maximum throughput
	 *
	 * The requested maximum throughput that the player considers sufficient for delivery of the asset. Values MUST be rounded to the
	 * nearest 100kbps.
	 *
	 * Integer kbps
	 */
	rtp?: number;

	////////////////
	// CMCD Event //
	////////////////

	/**
	 * Custom Event Name
	 *
	 * Used to define a custom event name. A maximum length of 64 characters is allowed. This key MUST be sent when the event type is
	 * 'ce' (custom event) and MUST NOT be sent when the event type is any other value. A custom key-value pair MAY be used to transfer
	 * a custom value associated with this event. The names chosen SHOULD associate the custom event name with the custom key name.
	 *
	 * String
	 */
	cen?: string;

	/**
	 * Event
	 *
	 * This key MUST only be used in Event mode and MUST be present on all reports. The minimum recommended set of supported events
	 * are: `ps`, `e`, `t`, and `rr`.
	 *
	 * - `abs` - ad break start
	 * - `abe` - ad break end
	 * - `ae` - ad end
	 * - `as` - ad start
	 * - `b` - backgrounded mode
	 * - `bc` - bitrate change
	 * - `c` - content ID changed
	 * - `ce` - custom event
	 * - `e` - error
	 * - `h` - hostname changed
	 * - `m` - mute
	 * - `pc` - player collapse
	 * - `pe` - player expand
	 * - `pr` - playback rate change
	 * - `ps` - play state change
	 * - `rr` - response received
	 * - `sk` - skip
	 * - `t` - time interval
	 * - `um` - unmute
	 *
	 * Token
	 */
	e?: CmcdEventType;

	/**
	 * Hostname
	 *
	 * A string identifying the current hostname from which the player is retrieving content. Maximum length is 128 characters.
	 *
	 * String
	 */
	h?: string;

	/**
	 * Timestamp
	 *
	 * The timestamp at which the associated event occurred, expressed as the number of milliseconds that have elapsed since the Unix
	 * Epoch (January 1, 1970, at 00:00:00 UTC), excluding leap seconds. When the event is a request for a media object the time SHOULD
	 * reference when the request was first initiated.
	 *
	 * This key MUST be included with all Event reports.
	 *
	 * Integer milliseconds
	 */
	ts?: number;

	///////////////////
	// CMCD Response //
	///////////////////

	/**
	 * CMSD Dynamic Header
	 *
	 * Holds a Base64 encoded copy of the CMSD data received on the CMSD-Dynamic response header. This key MUST only be reported on
	 * events of type `rr` (response received).
	 *
	 * String
	 */
	cmsdd?: string;

	/**
	 * CMSD Static Header
	 *
	 * Holds a Base64 encoded copy of the CMSD data received on the CMSD-Static response header. This key MUST only be reported on
	 * events of type `rr` (response received).
	 *
	 * String
	 */
	cmsds?: string;

	/**
	 * Response code
	 *
	 * The response code received when requesting a media object. In a redirect scenario, this would be the final response code received.
	 * A value of 0 SHOULD be used to indicate that a response was not received.
	 *
	 * This key MUST only be reported on events of type `rr` (response received).
	 *
	 * Integer
	 */
	rc?: number;

	/**
	 * SMRT-Data Header
	 *
	 * Holds a Base64 encoded copy of the streaming media response tracing data received on the Request Tracing header. This key MUST
	 * only be reported on events of type `rr` (response received).
	 *
	 * String
	 */
	smrt?: string;

	/**
	 * Time to first byte
	 *
	 * The elapsed time between when the request was first initiated (captured in ts) and the time when the first byte of the response
	 * was received. This key MUST only be reported on events of type `rr` (response received).
	 *
	 * Integer milliseconds
	 */
	ttfb?: number;

	/**
	 * Time to first body byte
	 *
	 * The elapsed time between when the request was first initiated (captured in ts) and the time the first bytes of the response body
	 * are received. This key MUST only be reported on events of type `rr` (response received).
	 *
	 * Integer milliseconds
	 */
	ttfbb?: number;

	/**
	 * Time to last byte
	 *
	 * The elapsed time between when the request was first initiated (captured in ts) and the time the response body is fully received.
	 * This key MUST only be reported on events of type `rr` (response received).
	 *
	 * Integer milliseconds
	 */
	ttlb?: number;

	/**
	 * Request URL
	 *
	 * The URL used to request the media object. If the request is redirected, this key MUST report the initial requested URL. This key
	 * MUST be reported on events of type `rr` (response received).
	 *
	 * String
	 */
	url?: string;
};
