/**
 * Resource Timing. This is a subset of the `PerformanceResourceTiming` interface.
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming
 *
 * @public
 */
export type ResourceTiming = {
	/**
	 * A `DOMHighResTimeStamp` for the time a resource fetch started.
	 */
	startTime: number;

	/**
	 * The size (in octets) of the payload body before removing any applied content encodings.
	 */
	encodedBodySize: number;

	/**
	 * A `DOMHighResTimeStamp` immediately after the browser receives the first byte of the response from the server.
	 */
	responseStart?: number;

	/**
	 * The difference (in milliseconds) between the `responseEnd` and the `startTime`.
	 */
	duration: number;
};
