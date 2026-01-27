import type { Cmcd } from './Cmcd.ts'
import type { CmcdObjectTypeList } from './CmcdObjectTypeList.ts'
import type { CmcdPlayerState } from './CmcdPlayerState.ts'

/**
 * Common Media Client Data (CMCD) is a standardized set of HTTP request header fields and query string parameters.
 *
 * @public
 */
export type CmcdRequest = Omit<Cmcd, 'nrr'> & {
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
	 * Backgrounded
	 *
	 * All players in a session are currently in a state that is not visible to the user due to a user interaction. This key SHOULD only
	 * be sent if it is TRUE. If the visibility state of the player is not known this key SHOULD NOT be reported.
	 *
	 * Boolean
	 */
	bg?: boolean;

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
	 * Player Error Code
	 *
	 * A string defining an error code produced by the player. The namespace and formatting of this error code is left to the application.
	 *
	 * Even if only one error code is being specified, the list notation MUST still be used.
	 *
	 * Errors should be buffered per report destination as they occur and reported along with the next CMCD report. With Event mode there
	 * is the option to report errors as they occur.
	 *
	 * Inner list of strings
	 */
	ec?: string[];

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
	 * Live stream latency
	 *
	 * The time delta between when a given media timestamp was made available at the origin and when it was rendered by the player. The
	 * accuracy of this estimate is dependent on synchronization between the packager and the player clocks.
	 *
	 * Integer milliseconds
	 */
	ltc?: number;

	/**
	 * Media Start Delay
	 *
	 * Measures the initial delay in wall-clock time from when a player is instructed to play media for a given session to when any media
	 * begins playback, whether it be primary content or interstitial content. This value SHOULD be the time difference between the
	 * "starting" and "playing" states.
	 *
	 * This key MUST only be sent once per Session ID and MUST be sent for each reporting mode which is active within the player.
	 *
	 * For request reporting mode, this key SHOULD be sent on the next media object request following successful startup.
	 *
	 * Integer milliseconds
	 */
	msd?: number;

	/**
	 * Non rendered
	 *
	 * True when the content being retrieved by a player is not rendered as audio or video. The key SHOULD only be sent when it is TRUE.
	 * The purpose of this key is to disambiguate active background players from foreground players which may be rendering interstitial
	 * content.
	 *
	 * Boolean
	 */
	nr?: boolean;

	/**
	 * Playhead bitrate
	 *
	 * The encoded bitrate of the media object(s) being shown to the end user.
	 *
	 * Inner list of integer kbps with token identifiers
	 */
	pb?: CmcdObjectTypeList;

	/**
	 * Playhead time
	 *
	 * The playhead time, expressed in milliseconds, which is being rendered to the viewer when the report is made. For Event mode, this
	 * corresponds to the playhead time that was rendered at the wallclock time reported by the timestamp field.
	 *
	 * For VOD, this MUST be milliseconds offset from the beginning of the media asset. For live streams with a playhead date time, this
	 * field MUST be expressed as the number of milliseconds that have elapsed since the Unix Epoch (January 1, 1970, at 00:00:00 UTC),
	 * excluding leap seconds.
	 *
	 * Integer milliseconds
	 */
	pt?: number;

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
	 * Note: if used with Request Mode, then this key represents a snapshot of the state at request time, which may obscure prior state
	 * changes since the last request. For most accurate state tracking in players, use Event mode. The addition of a timestamp in Request
	 * Mode might be useful in correctly placing the state change on a timeline.
	 *
	 * Token - one of [s,p,k,r,a,e,f,q,d]
	 */
	sta?: CmcdPlayerState;

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
	 * Target Buffer length
	 *
	 * The target buffer length associated with the media object being requested at the time of the request. This value SHOULD be rounded
	 * to the nearest 100 ms.
	 *
	 * Inner list of integer milliseconds with token identifiers
	 */
	tbl?: CmcdObjectTypeList;

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
};
