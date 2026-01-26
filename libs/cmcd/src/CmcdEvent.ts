import type { CmcdEventExcludedKeys } from './CmcdEventExcludedKeys.ts'
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
export type CmcdEvent = Omit<CmcdRequest, CmcdEventExcludedKeys> & {
	/**
	 * Event (event mode; e.g. "e", "t", "ps")
	 *
	 * This key MUST only be used in Event mode.
	 *
	 * ps - play state change. This token MUST be accompanied by a 'sta' key carrying the new state.
	 *
	 * e - the player has experienced an error. This token MUST be accompanied by a 'ec' key defining the player error code.
	 *
	 * t - time interval. The interval at which these reports are made is application-defined. A default interval of 30 seconds SHOULD
	 * be used if no explicit application interval is provided. Short form content may wish to use a shorter interval.
	 * An application-defined interval of zero should be interpreted as turning off interval event reporting.
	 * This event MUST be supported by all players that support Event mode.
	 *
	 * c - content ID has changed. This token MUST be accompanied by a 'cid' key defining the new content ID.
	 *
	 * b - the player has entered backgrounded mode if this event is accompanied by the ‘bg’ key and exited backgrounded mode if not.
	 *
	 * m - mute. The user activated the mute control or set the volume to zero.
	 *
	 * um - unmute. The user deactivated the mute control or raised the volume above zero if it was previously set to zero.
	 *
	 * pe - playerExpand. The user activated a control to extend the player to a larger size. The definition of this event is intended to be
	 * compliant with the VAST [VAST] Player Operation Metrics.
	 *
	 * c - playerCollapse: the user activated a control to reduce the player to a smaller size. The definition of this event is intended to be
	 * compliant with the VAST [VAST] Player Operation Metrics.
	 *
	 * Token - one of [ps,e,t,c,b,m,u m, abs, abe, as, ae]
	 */
	e?: CmcdEventType;

	/**
	 * Timestamp (ms since UNIX epoch, required for event mode)
	 *
	 * The timestamp at which the associated event occurred, expressed as milliseconds since the UNIX epoch.
	 * When the event is a request for a media object the time SHOULD reference when the request was first initiated.
	 * When used with Response Mode, the timestamp should indicate the time at which the object was first requested and not when it was received.
	 *
	 * Integer milliseconds
	*/
	ts?: number;
};
