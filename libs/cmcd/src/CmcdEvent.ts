import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequest } from './CmcdRequest.ts'

/**
 * CMCD v2 - Event Mode.
 *
 * Represents the event and keys for CMCD v2.
 *
 * This type is used to structure the data for reporting events according to the
 * Common Media Client Data (CMCD) version 2 specification. It encapsulates
 * the reporting event token.
 *
 * @public
 */
export type CmcdEvent = CmcdRequest & {
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
	 * - `abs` - ad break start: The start of an ad break or ad pod which would contain 1 or more sequential ads.
	 * - `abe` - ad break end: This signals the end of an ad break or ad pod.
	 * - `ae` - ad end: This token should be used at the end of the current playing ad but before exiting the ad.
	 * - `as` - ad start: This token should be used when a new ad begins playing within an ad break pod.
	 * - `b` - The player has entered backgrounded mode if this event is accompanied by the 'bg' key and exited backgrounded mode if not.
	 * - `bc` - The bitrate being requested by the player, for any object type, has changed.
	 * - `c` - content ID has changed.
	 * - `ce` - custom event.
	 * - `e` - the player has experienced an error. This token MUST be accompanied by a 'ec' key defining the player error code.
	 * - `h` - hostname has changed.
	 * - `m` - mute. The user activated the mute control or set the volume to zero.
	 * - `pc` - playerCollapse: the user activated a control to reduce the player to a smaller size.
	 * - `pe` - playerExpand: The user activated a control to extend the player to a larger size.
	 * - `pr` - playback rate change. This event only triggers while the state is playing ('p').
	 * - `ps` - play state change. This token MUST be accompanied by a 'sta' key carrying the new state.
	 * - `rr` - response received: This signals the receipt of a response. This event SHOULD be accompanied with the url key.
	 * - `sk` - skip: the user activated a control to skip an advertisement.
	 * - `t` - time interval. A default interval of 30 seconds SHOULD be used. This event MUST be supported by all players that support Event mode.
	 * - `um` - unmute. The user deactivated the mute control or raised the volume above zero if it was previously set to zero.
	 *
	 * Token - one of [abs,abe,ae,as,b,bc,c,ce,e,h,m,pc,pe,ps,rr,sk,t,um]
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
	 * Sequence Number
	 *
	 * A monotonically increasing integer to identify the sequence of a CMCD report to a target within a session. This MUST be reset to
	 * zero on the start of a new session-id. Sequence numbers increase independently per each combination of mode and target.
	 *
	 * Integer
	 */
	sn?: number;

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
};
