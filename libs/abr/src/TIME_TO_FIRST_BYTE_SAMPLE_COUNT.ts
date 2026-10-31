/**
 * The number of finished samples whose time to first byte the selectors average.
 * dash.js averages 4 latency samples as `averageLatencySampleAmount`, and its rules only log the average.
 * hls.js adds its time to first byte estimate to the fetch time check.
 *
 * @internal
 */
export const TIME_TO_FIRST_BYTE_SAMPLE_COUNT = 4
