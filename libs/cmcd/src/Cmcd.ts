import type { SfItem } from '@svta/cml-structured-field-values'
import type { ValueOrArray } from '@svta/cml-utils'
import type { CmcdCustomKey } from './CmcdCustomKey.ts'
import type { CmcdObjectType } from './CmcdObjectType.ts'
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
import type { CmcdStreamType } from './CmcdStreamType.ts'
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.ts'
import type { CmcdValue } from './CmcdValue.ts'

/**
 * Common Media Client Data (CMCD) is a standardized set of HTTP request header fields and query string parameters.
 *
 * @see {@link https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf|CMCD Spec}
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
	 * Next range request
	 *
	 * @deprecated Use 'nor' with the 'r' parameter instead.
	 *
	 * String
	 */
	nrr?: string;

	/**
	 * Startup
	 *
	 * Key is included without a value if the object is needed urgently due to startup, seeking or recovery after a buffer-empty event. The player
	 * reports this key as true until its buffer first reaches the target buffer for stable playback.
	 *
	 * Note: the starting State 's' is valid until the player renders media for the end user, which may be different from when the target buffer
	 * has been reached. As a result, 'su' = TRUE and 'sta' = 's' are not expected to align on a timeline.
	 *
	 * Boolean
	 */
	su?: boolean;

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
	 * - `v` = all segments are available – e.g., VOD
	 * - `l` = segments become available over time – e.g., LIVE
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
	 * Buffer starvation
	 *
	 * TRUE if the player buffer was starved at some point between the prior report and this report per reporting destination, resulting in
	 * the player entering a rebuffering state or remaining in a rebuffering state. Note that if the player begins requesting data from a
	 * new CDN, then this key might initially report buffering caused by the prior CDN. This key SHOULD NOT be reported if it is FALSE.
	 *
	 * If the object type 'ot' key is sent along with this key, then the 'bs' key refers to the buffer count associated with the particular
	 * object type. If no object type is communicated, then the buffer state applies to the current session.
	 *
	 * Boolean
	 */
	bs?: boolean;

	/**
	 * Requested maximum throughput
	 *
	 * The requested maximum throughput that the player considers sufficient for delivery of the asset. Values MUST be rounded to the
	 * nearest 100kbps. For example, a player would indicate that the current segment, encoded at 2Mbps, is to be delivered at no more
	 * than 10Mbps, by using rtp=10000.
	 *
	 * Note: This can benefit players by preventing buffer saturation through over-delivery and can also deliver a community benefit
	 * through fair-share delivery. The concept is that each player receives the throughput necessary for great performance, but no more.
	 * The CDN may not support the rtp feature.
	 *
	 * Integer kbps
	 */
	rtp?: number;
};
