import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdRequest } from './CmcdRequest.ts'

/**
 * Common Media Client Data (CMCD) version 2 - Event Mode.
 *
 * Extends {@link CmcdRequest} with event-specific keys for reporting events
 * according to the CMCD version 2 specification.
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
};
