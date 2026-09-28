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
	 * sent with an object type of 'a', 'v' or 'av'.
	 *
	 * Integer milliseconds
	 */
	bl?: number;

	/**
	 * Encoded bitrate
	 *
	 * The encoded bitrate of the audio or video object being requested. The player may not know this value precisely.
	 * However, the player MAY estimate it based upon playlist/manifest declarations. If the playlist declares both peak
	 * and average bitrate values, the peak value should be transmitted.
	 *
	 * Integer kbps
	 */
	br?: number;

	/**
	 * Measured throughput
	 *
	 * The throughput between client and server, as measured by the client. Throughput MUST be rounded to the nearest
	 * 100 kbps. This value, however derived, SHOULD be the value that the client uses for its next Adaptive Bitrate
	 * switching decision. If the client is connected to multiple servers concurrently, it must report only the
	 * throughput measured against the receiving server. If the client has multiple concurrent connections to the
	 * server, this value is intended to communicate the client's aggregate throughput across all those connections.
	 *
	 * Integer kbps
	 */
	mtp?: number;

	/**
	 * Next object request
	 *
	 * Relative path of the next object to be requested. The CDN can use this path to trigger pre-fetching. The path
	 * MUST be relative to the current request. The string MUST be URL-encoded. The client SHOULD NOT depend upon any
	 * pre-fetch action being taken. The key is only a request for such a pre-fetch.
	 *
	 * String
	 *
	 * @remarks
	 * Values may be provided as absolute URLs for convenience. If `CmcdEncodeOptions.baseUrl` is set, same-origin URLs
	 * are converted to paths relative to that base. Already-relative values are not converted. They are still
	 * URL-encoded when emitted, as CMCD version 1 requires.
	 */
	nor?: string;

	/**
	 * Next range request
	 *
	 * @deprecated Removed in CMCD version 2. Version 2 sends the range as the 'r' parameter of 'nor'.
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
	 * Integer kbps
	 */
	tb?: number;

}
