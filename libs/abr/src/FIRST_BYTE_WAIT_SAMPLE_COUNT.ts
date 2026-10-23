/**
 * The number of finished samples whose first-byte waits the starvation guard averages.
 * dash.js averages 4 latency samples as `averageLatencySampleAmount`, and its rules only log the average.
 * hls.js adds its first-byte estimate to the fetch time check.
 *
 * @internal
 */
export const FIRST_BYTE_WAIT_SAMPLE_COUNT = 4
