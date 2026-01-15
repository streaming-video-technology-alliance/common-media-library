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
	 * CMSD Dynamic Header (response mode)
	 *
	 * Holds a Base64 [base64] encoded copy of the CMSD data received on the CMSD-Dynamic response header.
	 * This key MUST only be used in RESPONSE mode.
	 *
	 * String
	*/
	cmsdd?: string;

	/**
	 * CMSD Static Header (response mode)
	 *
	 * Holds a Base64 [base64] encoded copy of the CMSD data received on the CMSD-Static response header.
	 * This key MUST only be used in RESPONSE mode.
	 *
	 * String
	*/
	cmsds?: string;

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
	 * Response code for object request (response mode)
	 *
	 * The response code received when requesting a media object. In a redirect scenario, this would be the final response code received.
	 * A value of 0 SHOULD be used to indicate that a response was not received.
	 *
	 * Integer
	*/
	rc?: number;

	/**
	 * SMRT Header

	 * Holds a Base64 [base64] encoded copy of the streaming media response tracing data received on the SMRT-Data header.
	 * This key MUST only be used in RESPONSE mode.
	 */
	smrt?: number;

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

	/**
	 * Time to first byte (ms; response mode)
	 *
	 * The elapsed time between when the request was first initiated (captured in ts) and the time when the first byte of the response was received.
	 * This value should only be reported if it is known. Absence of this key does not indicate that the response was not received.
	 *
	 * Integer milliseconds
	*/
	ttfb?: number;

	/**
	 * Time to first body byte (ms; response mode)
	 *
	 * The elapsed time between when the request was first initiated (captured in ts) and the time the first bytes of the response body are received.
	 * This value should only be reported if it is known. Absence of this key does not indicate that the body was not received.
	 *
	 * Integer milliseconds
	*/
	ttfbb?: number;

	/**
	 * Time to last byte (ms; response mode)
	 *
	 * The elapsed time between when the request was first initiated (captured in ts) and the time the response body is fully received.
	 * This value should only be reported if it is known.
	 * Absence of this key does not indicate that the response was not fully received
	 *
	 * Integer milliseconds
	*/
	ttlb?: number;

	/**
	 * Requested URL (string; response mode)
	 *
	 * The URL used to request the media object.
	 * This key MUST NOT be used with reporting mode #1.
	 * If the request is redirected, this key MUST report the initial requested URL.
	 *
	 * String
	*/
	url?: string;
};
