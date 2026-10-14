/**
 * The default `starvationTolerance` of the throughput selector, in seconds.
 * When no rung downloads before the buffer empties, the second pass of the starvation guard allows this much more time.
 * hls.js uses the same value as `maxStarvationDelay`.
 *
 * @beta
 */
export const DEFAULT_STARVATION_TOLERANCE = 4
