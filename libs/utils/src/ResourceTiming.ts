/**
 * Resource Timing.
 *
 *
 * @beta
 */
export type ResourceTiming = {
	// The timestamp for the time a resource fetch started.
	startTime: number;

	// The size (in octets) of the payload body before removing any applied content encodings.
	encodedBodySize: number;

	// The timestamp immediately after the browser receives the first byte of the response from the server.
	responseStart?: number;

	// The difference (in milliseconds) between the responseEnd and the startTime.
	duration: number;
};
