import type { CmcdCustomKey } from './CmcdCustomKey';
import type { CmcdValue } from './CmcdValue';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat';
import type { CmcdStreamType } from './CmcdStreamType';
import type { CmcdPlayerState } from './CmcdPlayerState';

export const CMCD_V2_COMMON_KEYS = [
	'br', 
	'ab', 
	'bl', 
	'tbl', 
	'bs', 
	'cdn', 
	'cid', 
	'ltc', 
	'mtp', 
	'pr', 
	'sf', 
	'sid', 
	'bg', 
	'sta', 
	'st', 
	'ts', 
	'tpb', 
	'tb', 
	'lb', 
	'tab', 
	'lab', 
	'pt', 
	'ec', 
	'msd', 
	'v',
] as const;

/**
 * Common Media Client Data (CMCD) is a standardized set of HTTP request header fields and query string parameters.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdV2Object = {

	/**
	 * Custom key names may be used, but they MUST carry a hyphenated prefix to ensure that there will not be a namespace collision
	 * with future revisions to this specification. Clients SHOULD use a reverse-DNS syntax when defining their own prefix.
	 */
	[index: CmcdCustomKey]: CmcdValue;

	////////////////////
	// CMCD V2 Object //
	////////////////////

	/**
	 * Encoded bitrate
	 *
	 * The encoded bitrate of the audio or video object being requested. This may not be known precisely by the player; however,
	 * it MAY be estimated based upon playlist/manifest declarations. If the playlist declares both peak and average bitrate values,
	 * the peak value should be transmitted.
	 *
	 * Integer kbps
	*/
	br?: number;

	/**
	 * Aggregate encoded bitrate
	 *
	 * The aggregate encoded bitrate of the complete media object including all object types. This SHOULD be derived from 
	 * playlist/manifest declarations, or it MAY be estimated by the player. If the playlist declares both peak and average bitrate values, 
	 * the peak value MUST be transmitted. This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’ or ‘o’. 
	 * This value MUST NOT be sent if the encoded bitrate is known.
	 * 
	 * Integer kbps
	*/
	ab?: number;

	/** Buffer length (ms) 
	 * 
	 * The buffer length associated with the media object being requested. This value SHOULD be rounded to the nearest 100 ms. 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’, ‘tt’, ‘c’, or ‘o’.
	 * 
	 * Integer milliseconds
	*/
	bl?: number;
	
	/** Target buffer length (ms) 
	 *
	 * The target buffer length associated with the media object being requested at the time of the request. 
	 * This value SHOULD be rounded to the nearest 100 ms. This value MUST NOT be sent for objects which do not have an object
	 * type of ‘a’, ‘v’, ‘av’, ‘tt’, ‘c’, or ‘o’
	 * 
	 * Integer milliseconds
	*/
	tbl?: number;

	/** Buffer starvation occurred since last request (boolean) 
	 * 
	 * Key is included without a value if the buffer was starved at some point between the prior request and this object request, 
	 * resulting in the player being in a rebuffering state and the video or audio playback being stalled. 
	 * This key MUST be sent if the buffer was starved since the prior request. Note that if the player begins requesting data from a new CDN, 
	 * then this key might initially report buffering caused by the prior CDN.
	 * 
	 * If the object type ‘ot’ key is sent along with this key, then the ‘bs’ key refers to the buffer associated with the particular object type. 
	 * If no object type is communicated, then the buffer state applies to the current session.
	 * 
	 * Boolean
	*/
	bs?: boolean;

	/** CDN ID (string, max 128 chars) 
	 * 
	 * A string identifying the current delivery network from which the player is retrieving content. Maximum length is 128 characters
	 * 
	 * String
	*/
	cdn?: string;
	
	/** Content ID (string, max 128 chars) 
	 * 
	 * A unique string identifying the current content. Maximum length is 128 characters.
	 * This value is consistent across multiple different sessions and devices and is defined and updated at the discretion of the service 
	 * provider
	 * 
	 * String
	*/
	cid?: string;
	
	/** Live stream latency (ms) 
	 * 
	 * The time delta between when a given media timestamp was made available at the origin and when it was rendered by the client. 
	 * The accuracy of this estimate is dependent on synchronization between the packager and the player clocks.
	 * 
	 * Integer Milliseconds
	*/
	ltc?: number;

	/** Measured throughput (kbps) 
	 * 
	 * The throughput between client and server, as measured by the client. Throughput MUST be rounded to the nearest 100 kbps. 
	 * This value, however derived, SHOULD be the value that the client is using to make its next Adaptive Bitrate switching decision. 
	 * If the client is connected to multiple servers concurrently, it must take care to report only the throughput measured against the receiving server. 
	 * If the client has multiple concurrent connections to the server, then the intent is that this value communicates the aggregate throughput the 
	 * client sees across all those connections.
	 * 
	 * Integer kilobits per second (kbps)
	*/
	mtp?: number;

	/** Playback rate (decimal) 
	 * 
	 * 1 if real-time, 
	 * 2 if double speed, 
	 * 0 if not playing. 
	 * 
	 * SHOULD only be sent if not equal to 1
	 * 
	 * Decimal
	*/
	pr?: number;

	/** Streaming format 
	 * 
	 * The streaming format that defines the current request.
	 * d = MPEG DASH [10]
	 * h = HTTP Live Streaming (HLS) [11]
	 * e = HESP [12]
	 * ld = Low latency DASH [10]
	 * l3 = Low latency low delay DASH (L3D)
	 * lh = Low Latency HLS [11]
	 * o = other
	 * s = Smooth Streaming [13]
	 * 
	 * If the streaming format being requested is unknown, then this key MUST NOT be used
	 * 
	 * Token - one of [d,h,e,ld,l3,lh,s,o]
	*/
	sf?: CmcdStreamingFormat;

	/** Session ID (string, max 64 chars, UUID recommended) 
	 * 
	 * A GUID identifying the current playback session. 
	 * A playback session typically ties together segments belonging to a single playback session. 
	 * This session may comprise the playback of primary content combined with interstitial content. 
	 * This session is being played on a single device. 
	 * Maximum length is 64 characters.
	 * It is RECOMMENDED to conform to the UUID specification
	 * 
	 * String
	*/
	sid?: string;
	
	/** Backgrounded (all players in session not visible, boolean) 
	 * 
	 * All players in a session are currently in a state that is not visible to the user. 
	 * This key SHOULD only be sent if it is TRUE. 
	 * If the visibility state of the player is not known this key SHOULD NOT be reported
	 * 
	 * Bool
	*/
	bg?: boolean;

	/** State (player state, e.g. "s", "p", etc.) 
	 * 
	 * A token describing the current playback state of the player as perceived by the end user, one of:
	 * s - starting: the player has been instructed to play media for a given session, either by a user interaction or by an autoplay action.
	 * p - playing : Media is being rendered.
	 * k - seeking : The start of the user initiated action of moving the playhead position.
	 * r - rebuffering : Media has stopped being rendered due to an insufficient buffer. This state is not reported during startup or seeking.
	 * a - paused : Playback has been intentionally paused by the user.
	 * w - waiting : Playback has been paused by the player.
	 * e - ended : Rendering has ended due to completion of the media asset playback.
	 * f - fatal error : Rendering has ended due to an irrecoverable error.
	 * q - quit : User initiated end of playback before media asset completion.
	 * d - preloading : the player is loading assets ahead of starting in order to provide a fast startup. The expectation is that playback will commence at a future time.
	 * 
	 * Note: if used with Request Mode or Response Mode, then this key represents a snapshot of the state at request time, which may obscure prior state changes since the last request. 
	 * For most accurate state tracking in players, use State-Interval mode. 
	 * The addition of a timestamp in Request Mode might be useful in correctly placing the state change on a timeline.
	 * 
	 * Token - one of [s,p,k,r,a,w,e,f,q,d] 
	*/
	sta?: CmcdPlayerState;

	/** Stream type 
	 * 
	 * v = all segments are available – e.g., VOD
	 * l = segments become available over time – e.g., LIVE
	 * 
	 * Token - one of [v,l]
	*/
	st?: CmcdStreamType;

	/** Timestamp (ms since UNIX epoch, required for event mode) 
	 *
	 * The timestamp at which the associated event occurred, expressed as milliseconds since the UNIX epoch. 
	 * When the event is a request for a media object the time SHOULD reference when the request was first initiated. 
	 * When used with Response Mode, the timestamp should indicate the time at which the object was first requested and not when it was received.
	 * 
	 * Integer milliseconds 
	*/
	ts?: number;

	/** Top playable bitrate (kbps) 
	 * 
	 * The highest bitrate rendition that the player is currently capable of playing for reasons other than bandwidth limitations. 
	 * This key captures the cases in which, for example, screen resolution, DRM, or performance constraints limit the player's topmost choice of bitrate.
	 * These constraints are intentionally obfuscated for privacy reasons.
	 * This key can increase the fingerprinting surface exposed by CMCD transmission and SHOULD NOT be transmitted in a default player configuration.
	 * 
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. 
	 * This top playable bitrate MUST apply to the object type being requested.
	 * Requests for video objects MUST specify the top playable video bitrate and requests for audio objects MUST specify the top playable audio bitrate. 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’ or ‘c’.
	 * 
	 * Integer Kbps 
	*/
	tpb?: number;

	/** Top encoded bitrate in manifest (kbps) 
	 * 
	 * The highest bitrate rendition in the manifest or playlist. 
	 * This SHOULD be derived from playlist/manifest declarations, or it MAY be estimated by the player. 
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. 
	 * This top bitrate MUST apply to the object type being requested. Requests for video objects MUST specify the top video bitrate and 
	 * requests for audio objects MUST specify the top audio bitrate. 
	 * 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’ or ‘c’.
	 * 
	 * Integer Kbps
	*/
	tb?: number;

	/** Lowest encoded bitrate (kbps) 
	 * 
	 * The lowest bitrate rendition in the manifest or playlist. 
	 * This SHOULD be derived from playlist/manifest declarations, or it MAY be estimated by the player. 
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. 
	 * This lowest bitrate MUST apply to the object type being requested.
	 * Requests for video objects MUST specify the lowest video bitrate and requests for audio objects MUST specify the lowest audio bitrate. 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’ or ‘c’.
	 * 
	 * Integer Kbps
	*/
	lb?: number;

	/** Top aggregated encoded bitrate (kbps) 
	 * 
	 * The highest aggregated bitrate rendition in the manifest or playlist. 
	 * This SHOULD be derived from playlist/manifest declarations, or it MAY be estimated by the player. 
	 * If the playlist declares both peak and average bitrate values,the peak value MUST be transmitted. 
	 * The aggregate encoded bitrate is of the complete media object including all object types. 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’ or ‘c’.
	 * This value MUST NOT be sent if the top encoded bitrate is known
	 * 
	 * Integer Kbps
	*/
	tab?: number;

	/** Lowest aggregated encoded bitrate (kbps)
	 * 
	 * The lowest aggregated bitrate rendition in the manifest or playlist. 
	 * This SHOULD be derived from playlist/manifest declarations, or it MAY be estimated by the player. 
	 * If the playlist declares both peak and average bitrate values, the peak value MUST be transmitted. 
	 * The aggregate encoded bitrate is of the complete media object including all object types. 
	 * This value MUST NOT be sent for objects which do not have an object type of ‘a’, ‘v’, ‘av’ or ‘c’.
	 * This value MUST NOT be sent if the lowest encoded bitrate is known.
	 * 
	 * Integer Kbps
	 */
	lab?: number;

	/** Playhead time (ms) 
	 * 
	 * The playhead time, expressed in milliseconds, which is being rendered to the viewer when the report is made. 
	 * For Response and State-Interval modes, this corresponds to the playhead time that was rendered at the wallclock time reported by the timestamp field.
	 * 
	 * Integer milliseconds
	*/
	pt?: number;

	/** Error code(s), application-defined 
	 * 
	 * A string defining an error code produced by the player. 
	 * The namespace and formatting of this error code is left to the application. 
	 * Use of standardized error codes is recommended.
	 * Errors should be buffered per report destination as they occur and reported along with the next CMCD report. 
	 * With Event mode there is the option to report errors as they occur.
	 * 
	 * An Inner List of Strings
	*/
	ec?: string | string[];

	/** Media Start Delay (ms) 
	 * 
	 * Measures the initial delay in wall-clock time from when a player is instructed to play media for a given session to when any media begins playback, 
	 * whether it be primary content or interstitial content. 
	 * This value SHOULD be the time difference between the "starting" and "playing" states.
	 * This key MUST only be sent once per Session ID and MUST be sent for each reporting mode which is active within the player.
	 * For request and response reporting modes, this key SHOULD be sent on the next media object request following successful startup.
	 * 
	 * Integer milliseconds
	*/
	msd?: number;

	/** CMCD version (integer, omit if 1)
	 * 
	 * The version of this specification used for interpreting the defined key names and values. 
	 * If this key is omitted, the client and server MUST interpret the values as being defined by version 1. 
	 * Client SHOULD omit this field if the version is 1 and MUST include this field if the version is not 1
	 * 
	 * Integer
	 */
	v?: number;
};
