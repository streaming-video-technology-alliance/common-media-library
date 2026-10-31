/**
 * The default `starvationSafetyFactor` of the BOLA selector.
 * The starvation guard assumes this fraction of the throughput for the download of the next segment.
 * dash.js uses 0.7 as the `throughputSafetyFactor` of its insufficient buffer rule.
 *
 * @beta
 */
export const DEFAULT_STARVATION_SAFETY_FACTOR = 0.7
