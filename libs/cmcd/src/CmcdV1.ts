/**
 * CMCD Version 1
 *
 * @public
 */
export type CmcdV1 = {
	/**
	 * Buffer length
	 *
	 * The buffer length associated with the media object being requested. This value MUST be rounded to the nearest 100 ms. This key SHOULD only be
	 * sent with an object type of ‘a’, ‘v’ or ‘av’.
	 *
	 * Integer milliseconds
	 */
	bl?: number;

	/**
	 * Bitrate
	 *
	 * Integer
	 */
	br?: number;

	/**
	 * Measured mtp CMCD throughput
	 *
	 * The throughput between client and server, as measured by the client and MUST be rounded to the nearest 100 kbps. This value, however derived,
	 * SHOULD be the value that the client is using to make its next Adaptive Bitrate switching decision. If the client is connected to multiple
	 * servers concurrently, it must take care to report only the throughput measured against the receiving server. If the client has multiple concurrent
	 * connections to the server, then the intent is that this value communicates the aggregate throughput the client sees across all those connections.
	 *
	 * Integer kbps
	 */
	mtp?: number;

	/**
	 * Next object request
	 *
	 * Relative path of the next object to be requested. This can be used to trigger pre-fetching by the CDN. This MUST be a path relative to the current
	 * request. This string MUST be URLEncoded. The client SHOULD NOT depend upon any pre-fetch action being taken - it is merely a request for such a
	 * pre-fetch to take place.
	 *
	 * String
	 */
	nor?: string;

	/**
	 * Next range request
	 *
	 * @deprecated Use 'nor' with the 'r' parameter instead.
	 *
	 * String
	 */
	nrr?: string;

	/**
	 * Top bitrate
	 *
	 * The highest bitrate rendition in the manifest or playlist that the client is allowed to play, given current codec, licensing and
	 * sizing constraints.
	 *
	 * Integer Kbps
	 */
	tb?: number;

}
