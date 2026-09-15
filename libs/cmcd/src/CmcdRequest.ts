import type { SfItem } from '@svta/cml-structured-field-values'
import type { CmcdCustomKey } from './CmcdCustomKey.ts'
import type { CmcdCustomValue } from './CmcdCustomValue.ts'
import type { CmcdObjectType } from './CmcdObjectType.ts'
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
import type { CmcdPlayerState } from './CmcdPlayerState.ts'
import type { CmcdStreamType } from './CmcdStreamType.ts'
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.ts'

/**
 * Common Media Client Data (CMCD) version 2 - Request Mode.
 *
 * A standardized set of HTTP request header fields and query string parameters
 * for communicating media playback metrics in request mode.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#request-mode | CTA-5004-B Request Mode}
 *
 * @public
 */
export type CmcdRequest = {

	/**
	 * Custom key names may be used, but they MUST have a hyphenated prefix. The prefix ensures that there is no
	 * namespace collision with future CMCD revisions. Clients SHOULD use a reverse-DNS syntax when defining their own
	 * prefix.
	 */
	[index: CmcdCustomKey]: CmcdCustomValue | undefined;

	/**
	 * Aggregate encoded bitrate
	 *
	 * The aggregate encoded bitrate across a playable combination of tracks. This key SHOULD NOT be used when the
	 * individual bitrates of the tracks are known. The player SHOULD derive this value from a playlist/manifest
	 * declaration, or MAY estimate it. If the playlist declares both peak and average bitrate values, the peak value
	 * MUST be transmitted. This value MUST NOT be sent if the encoded bitrate is known.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#aggregate-encoded-bitrate | CTA-5004-B Aggregate Encoded Bitrate}
	 */
	ab?: CmcdObjectTypeList;

	/**
	 * Backgrounded
	 *
	 * All players in a session are currently in a state that is not visible to the user due to a user interaction. This key SHOULD only
	 * be sent if it is TRUE. If the visibility state of the player is not known, this key SHOULD NOT be reported.
	 *
	 * Boolean
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#backgrounded | CTA-5004-B Backgrounded}
	 */
	bg?: boolean;

	/**
	 * Buffer length
	 *
	 * The buffer length associated with the media object being requested. This value SHOULD be rounded to the nearest 100 ms.
	 *
	 * Inner list of integer milliseconds with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#buffer-length | CTA-5004-B Buffer Length}
	 */
	bl?: CmcdObjectTypeList;

	/**
	 * Encoded bitrate
	 *
	 * The encoded bitrate. In request mode, this value is the encoded bitrate of the requested representation. In event
	 * mode, this value is the encoded bitrate of the currently selected representation. The player SHOULD derive this
	 * value from playlist/manifest declarations, or MAY estimate it. If the playlist declares both peak and average
	 * bitrate values, the peak value MUST be transmitted.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#encoded-bitrate | CTA-5004-B Encoded Bitrate}
	 */
	br?: CmcdObjectTypeList;

	/**
	 * Buffer starvation
	 *
	 * TRUE if the player buffer was starved at some point between the prior report and this report, per reporting
	 * destination. Starvation results in the player entering a rebuffering state or remaining in a rebuffering state.
	 * If the player begins requesting data from a new CDN, this key might initially report buffering caused by the
	 * prior CDN. This key SHOULD NOT be reported if it is FALSE.
	 *
	 * Boolean
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#buffer-starvation | CTA-5004-B Buffer Starvation}
	 */
	bs?: boolean;

	/**
	 * Buffer Starvation Absolute
	 *
	 * An absolute count of buffer starvation events since session initiation. A buffer starvation event occurs when the state changes
	 * to rebuffering. Token identifier MAY be omitted if the cause of the rebuffering is unknown.
	 *
	 * Inner list of integers with optional token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#buffer-starvation-absolute | CTA-5004-B Buffer Starvation Absolute}
	 */
	bsa?: CmcdObjectTypeList;

	/**
	 * Buffer Starvation Duration
	 *
	 * A list of durations of each buffer starvation period reported once the rebuffering has completed. This value MUST only be reported
	 * once per reporting mode and reporting destination. Token identifier MAY be omitted if the cause of the rebuffering is unknown.
	 *
	 * Inner list of integer milliseconds with optional token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#buffer-starvation-duration | CTA-5004-B Buffer Starvation Duration}
	 */
	bsd?: CmcdObjectTypeList;

	/**
	 * Buffer Starvation Duration Absolute
	 *
	 * An absolute count of buffer starvation duration since session initiation. Token identifier MAY be omitted if the cause of the
	 * rebuffering is unknown.
	 *
	 * Inner list of integer milliseconds with optional token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#buffer-starvation-duration-absolute | CTA-5004-B Buffer Starvation Duration Absolute}
	 */
	bsda?: CmcdObjectTypeList;

	/**
	 * CDN ID
	 *
	 * A string identifying the current delivery network from which the player is retrieving content. Maximum length is 128 characters.
	 *
	 * String
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#cdn-id | CTA-5004-B CDN ID}
	 */
	cdn?: string;

	/**
	 * Content ID
	 *
	 * A unique string identifying the current content. The maximum length is 128 characters. This value is consistent
	 * across different sessions and devices. The service provider defines and updates this value at its discretion.
	 *
	 * String
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#content-id | CTA-5004-B Content ID}
	 */
	cid?: string;

	/**
	 * Content Signature
	 *
	 * A string representing a signature of the content being played. This key SHOULD vary with content ID and be bound
	 * by some mechanism to the content. For example, this key may transmit the C2PA signature associated with the
	 * content being viewed.
	 *
	 * String
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#content-signature | CTA-5004-B Content Signature}
	 */
	cs?: string;

	/**
	 * Object duration
	 *
	 * The playback duration in milliseconds of the object being requested. If a partial segment is being requested,
	 * this value MUST indicate the playback duration of that part and not that of its parent segment.
	 * This value can be an approximation of the estimated duration if the explicit value is not known.
	 * This value MUST NOT be sent for objects which do not have an object type of 'a', 'v', 'av', 'tt', 'c', or 'o'.
	 *
	 * Integer milliseconds
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#object-duration | CTA-5004-B Object Duration}
	 */
	d?: number;

	/**
	 * Dropped Frames Absolute
	 *
	 * An absolute count of dropped frames since session initiation. This key SHOULD only be sent for content types of
	 * 'v', 'av' or 'o'. This value depends on the content being rendered, not on the content being retrieved.
	 * Therefore, sending the playhead time 'pt' key with this key is beneficial. The 'pt' key allows correct
	 * interpretation of this value.
	 *
	 * Integer
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#dropped-frames-absolute | CTA-5004-B Dropped Frames Absolute}
	 */
	dfa?: number;

	/**
	 * Deadline
	 *
	 * Deadline from the request time until the first sample of this Segment/Object needs to be available. Availability
	 * by the deadline avoids a buffer underrun or any other playback problems. This value MUST be rounded to the
	 * nearest 100ms. For a playback rate of 1, this value may be equivalent to the player's remaining buffer length.
	 *
	 * Integer milliseconds
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#deadline | CTA-5004-B Deadline}
	 */
	dl?: number;

	/**
	 * Player Error Code
	 *
	 * A string defining an error code produced by the player. The namespace and formatting of this error code are left to the application.
	 *
	 * Even if only one error code is being specified, the list notation MUST still be used.
	 *
	 * Inner list of strings
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#player-error-code | CTA-5004-B Player Error Code}
	 */
	ec?: string[];

	/**
	 * Lowest aggregated encoded bitrate
	 *
	 * The lowest aggregated bitrate rendition in the manifest or playlist. The player SHOULD derive this value from
	 * playlist/manifest declarations, or MAY estimate it. If the playlist declares both peak and average bitrate
	 * values, the peak value MUST be transmitted. The aggregate encoded bitrate is that of the complete media object,
	 * including all object types. This value MUST NOT be sent if the lowest encoded bitrate is known.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#lowest-aggregated-encoded-bitrate | CTA-5004-B Lowest Aggregated Encoded Bitrate}
	 */
	lab?: CmcdObjectTypeList;

	/**
	 * Lowest encoded bitrate
	 *
	 * The lowest bitrate rendition in the manifest or playlist. The player SHOULD derive this value from
	 * playlist/manifest declarations, or MAY estimate it. If the playlist declares both peak and average bitrate
	 * values, the peak value MUST be transmitted. This lowest bitrate MUST apply to the object type being requested.
	 * Requests for video objects MUST specify the lowest video bitrate. Requests for audio objects MUST specify the
	 * lowest audio bitrate.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#lowest-encoded-bitrate | CTA-5004-B Lowest Encoded Bitrate}
	 */
	lb?: CmcdObjectTypeList;

	/**
	 * Live stream latency
	 *
	 * The time delta between when a given media timestamp became available at the origin and when the player rendered
	 * it. The accuracy of this estimate depends on synchronization between the packager and the player clocks.
	 *
	 * Integer milliseconds
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#live-stream-latency | CTA-5004-B Live Stream Latency}
	 */
	ltc?: number;

	/**
	 * Media Start Delay
	 *
	 * The initial delay, in wall-clock time, from when the player is instructed to play media for a given session until
	 * any media begins playback. The media can be primary content or interstitial content. This value SHOULD be the
	 * time difference between the "starting" and "playing" states.
	 *
	 * This key MUST only be sent once per Session ID. This key MUST be sent for each reporting mode active within the
	 * player.
	 *
	 * Integer milliseconds
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#media-start-delay | CTA-5004-B Media Start Delay}
	 */
	msd?: number;

	/**
	 * Measured throughput
	 *
	 * The throughput between player and server, as measured by the player. Throughput MUST be rounded to the nearest
	 * 100 kbps. This value, however derived, SHOULD be the value that the player uses for its next Adaptive Bitrate
	 * switching decision. If the player requests different object types from different providers, it SHOULD match each
	 * object type request with the throughput measured against that provider. Reporting aggregate information is
	 * acceptable if objects of the same type are requested from different providers. If the player has multiple
	 * concurrent connections to the provider, this value is intended to communicate the player's aggregate throughput
	 * across all those connections. If this key is sent on an interval report, the value should be the last throughput
	 * estimate that the player made before the report. The player is not required to calculate the average measured
	 * throughput since the prior interval report.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#measured-throughput | CTA-5004-B Measured Throughput}
	 */
	mtp?: CmcdObjectTypeList;

	/**
	 * Next object request
	 *
	 * The relative path, as defined by RFC 3986, to one or more objects. The player making the current request can
	 * reasonably be expected to request these objects. Each object SHOULD be fetched in its entirety unless the future
	 * request has an associated range. Even if only one object is being specified, the list notation MUST still be
	 * used. If the future request has a range, the range is communicated as the parameter 'r' with a String value. The
	 * String value has a format similar to the HTTP Range header, with these exceptions. The unit MUST be 'byte'. The
	 * 'Range:' prefix is NOT permitted. Multiple ranges are NOT allowed. The only valid combinations are:
	 *
	 * - `"<range-start>-"`
	 * - `"<range-start>-<range-end>"`
	 * - `"-<suffix-length>"`
	 *
	 * The player SHOULD NOT depend upon any pre-fetch action being taken. The key is only a request for such a
	 * pre-fetch.
	 *
	 * Inner list of strings
	 *
	 * @remarks
	 * Values may be provided as absolute URLs for convenience. If {@link CmcdEncodeOptions.baseUrl} is set, same-origin
	 * URLs are converted to paths relative to that base. Already-relative values are emitted unchanged.
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#next-object-request | CTA-5004-B Next Object Request}
	 */
	nor?: (string | SfItem<string, { r: string }>)[];

	/**
	 * Non rendered
	 *
	 * True when the content being retrieved by a player is not rendered as audio or video. The key SHOULD only be sent when it is TRUE.
	 *
	 * Boolean
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#non-rendered | CTA-5004-B Non Rendered}
	 */
	nr?: boolean;

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
	 * If the object type being requested is unknown, this key MUST NOT be used.
	 *
	 * This key is also used as a token parameter for other keys.
	 *
	 * Token
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#object-type | CTA-5004-B Object Type}
	 */
	ot?: CmcdObjectType;

	/**
	 * Playhead bitrate
	 *
	 * The encoded bitrate of the media object(s) being shown to the end user.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#playhead-bitrate | CTA-5004-B Playhead Bitrate}
	 */
	pb?: CmcdObjectTypeList;

	/**
	 * Playback rate
	 *
	 * 1.0 if real-time, 2.0 if double speed, 0 if not playing. This value SHOULD only be sent if not equal to 1.0.
	 *
	 * Decimal
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#playback-rate | CTA-5004-B Playback Rate}
	 */
	pr?: number;

	/**
	 * Playhead time
	 *
	 * The playhead time, expressed in milliseconds, which is being rendered to the viewer when the report is made.
	 *
	 * Integer milliseconds
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#playhead-time | CTA-5004-B Playhead Time}
	 */
	pt?: number;

	/**
	 * Requested maximum throughput
	 *
	 * The requested maximum throughput that the player considers sufficient for delivery of the asset. Values MUST be rounded to the
	 * nearest 100kbps.
	 *
	 * Integer kbps
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#requested-maximum-throughput | CTA-5004-B Requested Maximum Throughput}
	 */
	rtp?: number;

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
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#streaming-format | CTA-5004-B Streaming Format}
	 */
	sf?: CmcdStreamingFormat;

	/**
	 * Session ID
	 *
	 * A GUID identifying the current playback session. A playback session typically consists of the playback of a
	 * single media asset with accompanying content such as advertisements. This session may comprise the playback of
	 * primary content combined with interstitial content. This session is being played on a single device. The maximum
	 * length is 64 characters. Conformance to the UUID specification is RECOMMENDED.
	 *
	 * String
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#session-id | CTA-5004-B Session ID}
	 */
	sid?: string;

	/**
	 * Sequence Number
	 *
	 * A monotonically increasing integer to identify the sequence of a CMCD report to a target within a session. This
	 * value MUST be reset to zero on the start of a new session-id. Sequence numbers increase independently for each
	 * combination of mode and target.
	 *
	 * Integer
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#sequence-number | CTA-5004-B Sequence Number}
	 */
	sn?: number;

	/**
	 * Stream type
	 *
	 * - `v` = all segments are available, for example VOD
	 * - `l` = segments become available over time, for example LIVE
	 * - `ll` = low latency LIVE
	 *
	 * Token
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#stream-type | CTA-5004-B Stream Type}
	 */
	st?: CmcdStreamType;

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
	 * - `d` - preloading: the player is loading, or has loaded, assets ahead of starting to provide a fast startup. The expectation is that playback will commence at a future time.
	 *
	 * Token - one of [s,p,k,r,a,e,f,q,d]
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#state | CTA-5004-B State}
	 */
	sta?: CmcdPlayerState;

	/**
	 * Startup
	 *
	 * The key is included without a value if the object is needed urgently due to startup, seeking or recovery after a
	 * buffer-empty event. The player reports this key as true until its buffer first reaches the target buffer for
	 * stable playback.
	 *
	 * Boolean
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#startup | CTA-5004-B Startup}
	 */
	su?: boolean;

	/**
	 * Top aggregated encoded bitrate
	 *
	 * The highest aggregated bitrate rendition in the manifest or playlist. The player SHOULD derive this value from
	 * playlist/manifest declarations, or MAY estimate it. If the playlist declares both peak and average bitrate
	 * values, the peak value MUST be transmitted. The aggregate encoded bitrate is that of the complete media object,
	 * including all object types. This value MUST NOT be sent if the top encoded bitrate is known.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#top-aggregated-encoded-bitrate | CTA-5004-B Top Aggregated Encoded Bitrate}
	 */
	tab?: CmcdObjectTypeList;

	/**
	 * Top encoded bitrate
	 *
	 * The highest bitrate rendition in the manifest or playlist. The player SHOULD derive this value from
	 * playlist/manifest declarations, or MAY estimate it. If the playlist declares both peak and average bitrate
	 * values, the peak value MUST be transmitted. This top bitrate MUST apply to the object type being requested.
	 * Requests for video objects MUST specify the top video bitrate. Requests for audio objects MUST specify the top
	 * audio bitrate.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#top-encoded-bitrate | CTA-5004-B Top Encoded Bitrate}
	 */
	tb?: CmcdObjectTypeList;

	/**
	 * Target Buffer length
	 *
	 * The target buffer length associated with the media object being requested at the time of the request. This value SHOULD be rounded
	 * to the nearest 100 ms.
	 *
	 * Inner list of integer milliseconds with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#target-buffer-length | CTA-5004-B Target Buffer Length}
	 */
	tbl?: CmcdObjectTypeList;

	/**
	 * Top playable bitrate
	 *
	 * The highest bitrate rendition that the player is currently capable of playing for reasons other than bandwidth
	 * limitations. This key applies to cases in which, for example, screen resolution, DRM, or performance constraints
	 * limit the player's topmost choice of bitrate. These constraints are intentionally obfuscated for privacy reasons.
	 *
	 * This key can increase the fingerprinting surface exposed by CMCD transmission. This key SHOULD NOT be transmitted
	 * in a default player configuration.
	 *
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. This top
	 * playable bitrate MUST apply to the object type being requested. Requests for video objects MUST specify the top
	 * playable video bitrate. Requests for audio objects MUST specify the top playable audio bitrate. This value MUST
	 * NOT be sent for objects which do not have an object type of 'a', 'v', 'av' or 'c'.
	 *
	 * Inner list of integer kbps with token identifiers
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#top-playable-bitrate | CTA-5004-B Top Playable Bitrate}
	 */
	tpb?: CmcdObjectTypeList;

	/**
	 * Version
	 *
	 * The CMCD version used to interpret the defined key names and values. If this key is omitted, the player and
	 * server MUST interpret the values as defined by version 1. The player SHOULD omit this key if the version is 1.
	 * The player MUST include this key if the version is not 1.
	 *
	 * Integer
	 *
	 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#version | CTA-5004-B Version}
	 */
	v?: number;
};
