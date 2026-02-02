import type { CmcdRequest } from './CmcdRequest.ts'

/**
 * Common Media Client Data (CMCD) version 2 - Response Mode.
 *
 * Extends {@link CmcdRequest} with response-specific keys for reporting
 * response data according to the CMCD version 2 specification.
 *
 * @public
 */
export type CmcdResponse = CmcdRequest & {

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
