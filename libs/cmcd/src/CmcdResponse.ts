import type { CmcdRequest } from './CmcdRequest.js';

/**
 * CMCD Response Mode.
 *
 * Defines the keys for the CMCD (Common Media Client Data) v2 Response group.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdResponse = CmcdRequest & {
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
	 * SMRT Header

	 * Holds a Base64 [base64] encoded copy of the streaming media response tracing data received on the SMRT-Data header.
	 * This key MUST only be used in RESPONSE mode.
	 */
	smrt?: number;
};
